import dgram from 'dgram';
import os from 'os';
import Bonjour from 'bonjour-service';

export const CAMPUS_QUEST_SERVICE_TYPE = 'campusquest';
export const CAMPUS_QUEST_SERVICE_FQDN = '_campusquest._tcp.local';
export const CAMPUS_QUEST_HEALTH_PATH = '/api/health';
const configuredDiscoveryPort = parseInt(
  process.env.CAMPUS_QUEST_DISCOVERY_PORT || '37020',
  10
);
export const CAMPUS_QUEST_DISCOVERY_PORT = Number.isFinite(configuredDiscoveryPort)
  ? configuredDiscoveryPort
  : 37020;
export const CAMPUS_QUEST_DISCOVERY_PROBE = 'CAMPUS_QUEST_DISCOVER_V1';

export interface BackendDiscoveryOptions {
  port: number;
  discoveryPort?: number;
  serviceName?: string;
  apiVersion?: number;
}

export interface BackendDiscoveryHandle {
  stop: () => Promise<void>;
}

interface DiscoveryBeacon {
  service: 'campus-quest';
  apiVersion: number;
  port: number;
  protocol: 'http';
  health: string;
  name: string;
}

export function startBackendDiscovery(options: BackendDiscoveryOptions): BackendDiscoveryHandle {
  const discoveryPort = options.discoveryPort ?? CAMPUS_QUEST_DISCOVERY_PORT;
  const apiVersion = options.apiVersion ?? 1;
  const serviceName =
    options.serviceName || `Campus Quest (${os.hostname()})`;
  const beacon: DiscoveryBeacon = {
    service: 'campus-quest',
    apiVersion,
    port: options.port,
    protocol: 'http',
    health: CAMPUS_QUEST_HEALTH_PATH,
    name: serviceName,
  };

  let bonjour: Bonjour | null = null;
  let udpSocket: dgram.Socket | null = null;
  let stopped = false;

  try {
    bonjour = new Bonjour({}, (error: Error) => {
      console.warn('[Campus Quest Discovery] mDNS warning:', error.message);
    });
    const service = bonjour.publish({
      name: serviceName,
      type: CAMPUS_QUEST_SERVICE_TYPE,
      protocol: 'tcp',
      port: options.port,
      probe: true,
      txt: {
        service: 'campus-quest',
        apiVersion: String(apiVersion),
        health: CAMPUS_QUEST_HEALTH_PATH,
        protocol: 'http',
      },
    });
    service.on('error', (error: Error) => {
      console.warn('[Campus Quest Discovery] mDNS publish warning:', error.message);
    });
    console.log(
      `[Campus Quest Discovery] Advertising ${CAMPUS_QUEST_SERVICE_FQDN} on port ${options.port}`
    );
  } catch (error: any) {
    console.warn(
      '[Campus Quest Discovery] mDNS advertisement unavailable:',
      error?.message || error
    );
    try {
      bonjour?.destroy();
    } catch {}
    bonjour = null;
  }

  try {
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    udpSocket = socket;
    socket.on('error', (error) => {
      console.warn('[Campus Quest Discovery] UDP responder warning:', error.message);
      try {
        socket.close();
      } catch {}
      if (udpSocket === socket) {
        udpSocket = null;
      }
    });
    socket.on('message', (message, remote) => {
      if (stopped || message.toString('utf8') !== CAMPUS_QUEST_DISCOVERY_PROBE) {
        return;
      }
      const response = Buffer.from(JSON.stringify(beacon), 'utf8');
      socket.send(response, remote.port, remote.address, (error) => {
        if (error && !stopped) {
          console.warn(
            '[Campus Quest Discovery] UDP reply failed:',
            error.message
          );
        }
      });
    });
    socket.bind(discoveryPort, '0.0.0.0', () => {
      console.log(
        `[Campus Quest Discovery] UDP fallback listening on 0.0.0.0:${discoveryPort}`
      );
      try {
        socket.setBroadcast(true);
      } catch (error: any) {
        console.warn(
          '[Campus Quest Discovery] UDP broadcast unavailable:',
          error?.message || error
        );
      }
    });
  } catch (error: any) {
    console.warn(
      '[Campus Quest Discovery] UDP fallback unavailable:',
      error?.message || error
    );
    udpSocket = null;
  }

  return {
    stop: () =>
      new Promise<void>((resolve) => {
        if (stopped) {
          resolve();
          return;
        }
        stopped = true;
        let pending = 1;

        const done = () => {
          pending -= 1;
          if (pending === 0) {
            resolve();
          }
        };

        const socket = udpSocket;
        udpSocket = null;
        if (socket) {
          pending += 1;
          try {
            socket.close(() => done());
          } catch {
            done();
          }
        }

        const mdns = bonjour;
        bonjour = null;
        if (mdns) {
          pending += 1;
          try {
            mdns.destroy(() => done());
          } catch {
            done();
          }
        }

        done();
      }),
  };
}
