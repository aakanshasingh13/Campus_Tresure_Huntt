import assert from 'node:assert/strict';
import dgram from 'node:dgram';
import http from 'node:http';
import multicastDns from 'multicast-dns';
import {
  CAMPUS_QUEST_DISCOVERY_PROBE,
  CAMPUS_QUEST_SERVICE_FQDN,
  startBackendDiscovery,
} from '../backendDiscovery';
import { verifyCampusQuestBackend } from '../src/lib/apiConfig';

const SERVICE_PORT = 35999;
const DISCOVERY_PORT = 37021;
const HEALTH_PORT = 35998;

function waitForMdnsService(timeoutMs: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const mdns = multicastDns();
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for the mDNS advertisement.'));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      mdns.removeAllListeners();
      mdns.destroy();
    };

    mdns.on('error', (error) => {
      cleanup();
      reject(error);
    });

    mdns.on('response', (packet: any) => {
      const records = [...(packet.answers || []), ...(packet.additionals || [])];
      const ptr = records.find(
        (record) =>
          record.type === 'PTR' &&
          String(record.name).toLowerCase() === CAMPUS_QUEST_SERVICE_FQDN
      );
      const srv = records.find(
        (record) => record.type === 'SRV' && record.data?.port === SERVICE_PORT
      );
      const txt = records.find(
        (record) =>
          record.type === 'TXT' &&
          (record.data || []).some((entry: Buffer) =>
            entry.toString('utf8').includes('service=campus-quest')
          )
      );

      if (ptr && srv && txt) {
        cleanup();
        resolve(packet);
      }
    });

    mdns.on('ready', () => {
      mdns.query([{ name: CAMPUS_QUEST_SERVICE_FQDN, type: 'PTR' }]);
    });
  });
}

function waitForUdpBeacon(timeoutMs: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket('udp4');
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for the UDP discovery beacon.'));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      try {
        socket.close();
      } catch {}
    };

    socket.on('error', (error) => {
      cleanup();
      reject(error);
    });

    socket.on('message', (message) => {
      try {
        const payload = JSON.parse(message.toString('utf8'));
        cleanup();
        resolve(payload);
      } catch (error) {
        cleanup();
        reject(error);
      }
    });

    socket.send(
      CAMPUS_QUEST_DISCOVERY_PROBE,
      DISCOVERY_PORT,
      '127.0.0.1'
    );
  });
}

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testHealthIdentity(): Promise<void> {
  let identity = 'not-campus-quest';
  const server = http.createServer((req, res) => {
    if (req.url === '/api/health') {
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          service: identity,
          status: 'healthy',
          apiVersion: 1,
        })
      );
      return;
    }
    res.statusCode = 404;
    res.end();
  });

  await new Promise<void>((resolve) => server.listen(HEALTH_PORT, '127.0.0.1', resolve));

  try {
    const rejected = await verifyCampusQuestBackend(
      `http://127.0.0.1:${HEALTH_PORT}`,
      2000
    );
    assert.equal(rejected.ok, false, 'A non-Campus-Quest health payload must be rejected.');

    identity = 'campus-quest';
    const accepted = await verifyCampusQuestBackend(
      `http://127.0.0.1:${HEALTH_PORT}`,
      2000
    );
    assert.equal(accepted.ok, true, 'A verified Campus Quest health payload must be accepted.');
    assert.equal(accepted.health?.service, 'campus-quest');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

async function main(): Promise<void> {
  const advertisement = startBackendDiscovery({
    port: SERVICE_PORT,
    discoveryPort: DISCOVERY_PORT,
    serviceName: 'Campus Quest Discovery Test',
  });

  try {
    await wait(1200);

    const packet = await waitForMdnsService(6000);
    assert.ok(packet, 'Expected an mDNS response.');
    console.log('PASS: mDNS service advertisement is discoverable.');

    const beacon = await waitForUdpBeacon(3000);
    assert.equal(beacon.service, 'campus-quest');
    assert.equal(beacon.port, SERVICE_PORT);
    console.log('PASS: UDP fallback beacon returns the backend identity and port.');

    await testHealthIdentity();
    console.log('PASS: health identity verification rejects impostors and accepts Campus Quest.');
  } finally {
    await advertisement.stop();
  }
}

main()
  .then(() => {
    console.log('All backend discovery tests passed.');
  })
  .catch((error) => {
    console.error('Backend discovery test failed:', error);
    process.exitCode = 1;
  });
