import { HttpBridge } from '../http-bridge';
import { IntegrationPort, IntegrationRequest, IntegrationReceipt } from '../port';
import { InteractionKernelHttpBridge } from '../interaction-kernel/http-bridge';
import { konnaxionPublishEnvelope } from '../interaction-kernel/outbound';

/**
 * Migration-safe Konnaxion adapter.
 *
 * - If KONNAXION_IK_URL is configured, outbound operations use IK.
 * - Otherwise the existing legacy bridge remains authoritative and unchanged.
 */
export class KonnaxionAdapter implements IntegrationPort {
  private readonly legacy = new HttpBridge(
    process.env.KONNAXION_BRIDGE_URL,
    process.env.KONNAXION_BRIDGE_TOKEN,
    ['publish', 'distribute'],
  );
  private readonly ik = process.env.KONNAXION_IK_URL
    ? new InteractionKernelHttpBridge(
        process.env.KONNAXION_IK_URL,
        process.env.KONNAXION_IK_TOKEN ?? process.env.KONNAXION_BRIDGE_TOKEN,
      )
    : null;

  execute(request: IntegrationRequest): Promise<IntegrationReceipt> {
    if (!this.ik) return this.legacy.execute(request);
    if (request.operation !== 'publish') return this.legacy.execute(request);
    return this.ik.execute(konnaxionPublishEnvelope(request));
  }
}
