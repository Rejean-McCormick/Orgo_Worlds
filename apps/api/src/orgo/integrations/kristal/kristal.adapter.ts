import { HttpBridge } from '../http-bridge';

/**
 * Legacy direct-Kristal adapter retained only for migration compatibility.
 * New Kristal v5 workflows MUST use provider `daat`, which is the IK/ACL boundary.
 */
export class KristalAdapter extends HttpBridge {
  constructor() {
    super(process.env.KRISTAL_BRIDGE_URL, process.env.KRISTAL_BRIDGE_TOKEN, [
      'validate',
    ]);
  }
}
