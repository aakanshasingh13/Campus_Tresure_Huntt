package com.campusquest.app;

import android.content.Context;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.InterfaceAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.net.SocketTimeoutException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(name = "CampusQuestDiscovery")
public class CampusQuestDiscoveryPlugin extends Plugin {

    private static final String TAG = "CampusQuestDiscovery";
    private static final String SERVICE_TYPE = "_campusquest._tcp.";
    private static final String SERVICE_PREFIX = "_campusquest._tcp";
    private static final String DISCOVERY_PROBE = "CAMPUS_QUEST_DISCOVER_V1";
    private static final int DISCOVERY_PORT = 37020;
    private static final int UDP_RECEIVE_TIMEOUT_MS = 1200;
    private static final int UDP_TOTAL_MS = 5500;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Set<String> discoveredServices = Collections.synchronizedSet(new HashSet<>());
    private final Set<String> emittedCandidates = Collections.synchronizedSet(new HashSet<>());
    private final List<NsdServiceInfo> resolveQueue = new ArrayList<>();
    private final Object resolveLock = new Object();
    private final AtomicBoolean udpRunning = new AtomicBoolean(false);

    private NsdManager nsdManager;
    private NsdManager.DiscoveryListener discoveryListener;
    private ExecutorService executor;
    private volatile DatagramSocket udpSocket;
    private volatile boolean pluginActive = false;
    private volatile boolean nsdStarting = false;
    private volatile boolean discovering = false;
    private boolean resolving = false;

    @PluginMethod
    public void start(PluginCall call) {
        pluginActive = true;
        mainHandler.post(() -> {
            startNsd();
            startUdpFallback();
            JSObject result = new JSObject();
            result.put("started", true);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        pluginActive = false;
        stopNsd();
        stopUdpFallback();
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        pluginActive = false;
        stopNsd();
        stopUdpFallback();
        if (executor != null) {
            executor.shutdownNow();
            executor = null;
        }
        super.handleOnDestroy();
    }

    private void startNsd() {
        if (!pluginActive || discovering || nsdStarting) {
            return;
        }
        nsdStarting = true;

        if (nsdManager == null) {
            nsdManager = (NsdManager) getContext().getSystemService(Context.NSD_SERVICE);
        }
        if (nsdManager == null) {
            nsdStarting = false;
            emitState("mdnsUnavailable", "Android network service discovery is unavailable.");
            return;
        }

        discoveredServices.clear();
        emittedCandidates.clear();

        discoveryListener = new NsdManager.DiscoveryListener() {
            @Override
            public void onDiscoveryStarted(String serviceType) {
                discovering = true;
                nsdStarting = false;
                emitState("mdnsStarted", "Searching for Campus Quest with mDNS.");
                Log.d(TAG, "mDNS discovery started for " + serviceType);
            }

            @Override
            public void onServiceFound(NsdServiceInfo serviceInfo) {
                if (!isCampusQuestService(serviceInfo)) {
                    return;
                }
                String key = serviceInfo.getServiceName() + "|" + serviceInfo.getServiceType();
                if (!discoveredServices.add(key)) {
                    return;
                }
                enqueueResolve(serviceInfo);
            }

            @Override
            public void onServiceLost(NsdServiceInfo serviceInfo) {
                discoveredServices.remove(
                    serviceInfo.getServiceName() + "|" + serviceInfo.getServiceType()
                );
            }

            @Override
            public void onDiscoveryStopped(String serviceType) {
                discovering = false;
                nsdStarting = false;
            }

            @Override
            public void onStartDiscoveryFailed(String serviceType, int errorCode) {
                discovering = false;
                nsdStarting = false;
                emitState(
                    "mdnsFailed",
                    "mDNS discovery could not start (code " + errorCode + ")."
                );
                Log.w(TAG, "mDNS start failed: " + errorCode);
                mainHandler.post(CampusQuestDiscoveryPlugin.this::stopNsd);
            }

            @Override
            public void onStopDiscoveryFailed(String serviceType, int errorCode) {
                discovering = false;
                nsdStarting = false;
                Log.w(TAG, "mDNS stop failed: " + errorCode);
            }
        };

        try {
            nsdManager.discoverServices(
                SERVICE_TYPE,
                NsdManager.PROTOCOL_DNS_SD,
                discoveryListener
            );
        } catch (Exception error) {
            discovering = false;
            nsdStarting = false;
            emitState("mdnsFailed", "mDNS discovery is unavailable.");
            Log.w(TAG, "Unable to start mDNS discovery", error);
        }
    }

    private boolean isCampusQuestService(NsdServiceInfo serviceInfo) {
        String type = serviceInfo.getServiceType();
        if (type == null) {
            return true;
        }
        return type.toLowerCase(Locale.US).startsWith(SERVICE_PREFIX);
    }

    private void enqueueResolve(NsdServiceInfo serviceInfo) {
        synchronized (resolveLock) {
            resolveQueue.add(serviceInfo);
            if (resolving) {
                return;
            }
            resolving = true;
        }
        mainHandler.post(this::resolveNext);
    }

    private void resolveNext() {
        NsdServiceInfo serviceInfo;
        synchronized (resolveLock) {
            if (!pluginActive || resolveQueue.isEmpty()) {
                resolving = false;
                return;
            }
            serviceInfo = resolveQueue.remove(0);
        }

        try {
            nsdManager.resolveService(
                serviceInfo,
                new NsdManager.ResolveListener() {
                    @Override
                    public void onResolveFailed(NsdServiceInfo failedService, int errorCode) {
                        Log.w(TAG, "mDNS resolve failed: " + errorCode);
                        synchronized (discoveredServices) {
                            discoveredServices.remove(
                                failedService.getServiceName() + "|" + failedService.getServiceType()
                            );
                        }
                        finishResolve();
                    }

                    @Override
                    public void onServiceResolved(NsdServiceInfo resolvedService) {
                        handleResolvedService(resolvedService);
                        finishResolve();
                    }
                }
            );
        } catch (Exception error) {
            Log.w(TAG, "Unable to resolve mDNS service", error);
            finishResolve();
        }
    }

    private void finishResolve() {
        synchronized (resolveLock) {
            resolving = false;
        }
        mainHandler.post(this::resolveNext);
    }

    private void handleResolvedService(NsdServiceInfo serviceInfo) {
        int port = serviceInfo.getPort();
        if (port <= 0 || port > 65535) {
            return;
        }

        InetAddress host = preferredHost(serviceInfo);
        if (host == null || host.isLoopbackAddress()) {
            return;
        }

        String formattedHost = formatHost(host);
        if (formattedHost == null) {
            return;
        }

        String url = "http://" + formattedHost + ":" + port;
        emitCandidate(url, "mdns", serviceInfo.getServiceName());
    }

    private InetAddress preferredHost(NsdServiceInfo serviceInfo) {
        InetAddress host = serviceInfo.getHost();
        if (host != null) {
            return host;
        }

        if (Build.VERSION.SDK_INT >= 34) {
            List<InetAddress> addresses = serviceInfo.getHostAddresses();
            if (addresses != null && !addresses.isEmpty()) {
                for (InetAddress address : addresses) {
                    if (address instanceof Inet4Address) {
                        return address;
                    }
                }
                return addresses.get(0);
            }
        }
        return null;
    }

    private String formatHost(InetAddress address) {
        String host = address.getHostAddress();
        if (host == null || host.trim().isEmpty()) {
            return null;
        }

        int scopeIndex = host.indexOf('%');
        if (scopeIndex >= 0) {
            host = host.substring(0, scopeIndex);
        }

        if (address instanceof Inet6Address || host.contains(":")) {
            return "[" + host + "]";
        }
        return host;
    }

    private void stopNsd() {
        NsdManager.DiscoveryListener listener = discoveryListener;
        discoveryListener = null;
        discovering = false;
        nsdStarting = false;

        synchronized (resolveLock) {
            resolveQueue.clear();
            resolving = false;
        }

        if (nsdManager != null && listener != null) {
            try {
                nsdManager.stopServiceDiscovery(listener);
            } catch (Exception error) {
                Log.d(TAG, "mDNS discovery was already stopped");
            }
        }
    }

    private void startUdpFallback() {
        if (!pluginActive || udpRunning.get()) {
            return;
        }
        if (executor == null || executor.isShutdown()) {
            executor = Executors.newSingleThreadExecutor();
        }
        udpRunning.set(true);
        executor.execute(this::runUdpFallback);
    }

    private void runUdpFallback() {
        DatagramSocket socket = null;
        try {
            socket = new DatagramSocket();
            socket.setBroadcast(true);
            socket.setSoTimeout(UDP_RECEIVE_TIMEOUT_MS);
            udpSocket = socket;

            List<InetAddress> targets = collectBroadcastTargets();
            byte[] probe = DISCOVERY_PROBE.getBytes(StandardCharsets.UTF_8);
            long deadline = System.currentTimeMillis() + UDP_TOTAL_MS;
            int emptyRounds = 0;

            while (
                pluginActive &&
                udpRunning.get() &&
                System.currentTimeMillis() < deadline
            ) {
                for (InetAddress target : targets) {
                    try {
                        socket.send(
                            new DatagramPacket(probe, probe.length, target, DISCOVERY_PORT)
                        );
                    } catch (IOException error) {
                        Log.d(TAG, "Broadcast send skipped: " + error.getMessage());
                    }
                }

                try {
                    byte[] buffer = new byte[2048];
                    DatagramPacket response = new DatagramPacket(buffer, buffer.length);
                    socket.receive(response);
                    handleUdpResponse(response);
                    emptyRounds = 0;
                } catch (SocketTimeoutException timeout) {
                    emptyRounds += 1;
                    if (emptyRounds >= 3) {
                        break;
                    }
                } catch (SocketException closed) {
                    break;
                }
            }
        } catch (IOException error) {
            emitState("udpFailed", "UDP fallback discovery is unavailable.");
            Log.w(TAG, "UDP fallback failed", error);
        } finally {
            if (udpSocket != null) {
                try {
                    udpSocket.close();
                } catch (Exception ignored) {}
                udpSocket = null;
            }
            udpRunning.set(false);
        }
    }

    private List<InetAddress> collectBroadcastTargets() {
        List<InetAddress> targets = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        try {
            InetAddress limitedBroadcast = InetAddress.getByName("255.255.255.255");
            targets.add(limitedBroadcast);
            seen.add(limitedBroadcast.getHostAddress());
        } catch (Exception error) {
            Log.d(TAG, "Limited broadcast address unavailable");
        }

        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            if (interfaces == null) {
                return targets;
            }
            while (interfaces.hasMoreElements()) {
                NetworkInterface networkInterface = interfaces.nextElement();
                if (!networkInterface.isUp() || networkInterface.isLoopback()) {
                    continue;
                }
                for (InterfaceAddress interfaceAddress : networkInterface.getInterfaceAddresses()) {
                    InetAddress broadcast = interfaceAddress.getBroadcast();
                    if (broadcast == null) {
                        continue;
                    }
                    String key = broadcast.getHostAddress();
                    if (seen.add(key)) {
                        targets.add(broadcast);
                    }
                }
            }
        } catch (SocketException error) {
            Log.d(TAG, "Unable to read network interfaces: " + error.getMessage());
        }

        return targets;
    }

    private void handleUdpResponse(DatagramPacket response) {
        try {
            String body = new String(
                response.getData(),
                response.getOffset(),
                response.getLength(),
                StandardCharsets.UTF_8
            );
            JSONObject payload = new JSONObject(body);
            if (!"campus-quest".equals(payload.optString("service"))) {
                return;
            }

            int port = payload.optInt("port", 0);
            if (port <= 0 || port > 65535) {
                return;
            }

            String host = response.getAddress().getHostAddress();
            if (host == null || host.isEmpty()) {
                return;
            }

            String url = "http://" + formatHost(response.getAddress()) + ":" + port;
            emitCandidate(url, "udp", payload.optString("name", "Campus Quest"));
        } catch (Exception error) {
            Log.d(TAG, "Ignoring malformed UDP discovery response");
        }
    }

    private void stopUdpFallback() {
        udpRunning.set(false);
        DatagramSocket socket = udpSocket;
        udpSocket = null;
        if (socket != null) {
            try {
                socket.close();
            } catch (Exception ignored) {}
        }
    }

    private void emitCandidate(String url, String source, String name) {
        if (url == null || url.isEmpty()) {
            return;
        }
        if (!emittedCandidates.add(url)) {
            return;
        }

        mainHandler.post(() -> {
            if (!pluginActive) {
                return;
            }
            JSObject event = new JSObject();
            event.put("url", url);
            event.put("source", source);
            event.put("name", name);
            notifyListeners("candidate", event);
        });
    }

    private void emitState(String state, String message) {
        mainHandler.post(() -> {
            if (!pluginActive) {
                return;
            }
            JSObject event = new JSObject();
            event.put("state", state);
            event.put("message", message);
            notifyListeners("state", event);
        });
    }
}
