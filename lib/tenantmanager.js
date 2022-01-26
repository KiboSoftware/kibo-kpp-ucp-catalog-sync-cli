import axios from "axios";
const homeHost = process.env["KIBO_HOME_HOST"] || "home.mozu.com";
const homeApi = `https://${homeHost}/api`;

class TenantManager {
  constructor({ authenticator }) {
    this.authenticator = authenticator;
  }
  async getTenant(profile) {
    const ticket = await this.authenticator.getTicket(profile);
    const config = {
      headers: {
        Authorization: `Bearer ${ticket.access_token}`,
      },
    };
    const resp = await axios.get(
      `${homeApi}/platform/tenants/${profile.tenantId}`,
      config
    );
    if (resp.status == 200) {
      return resp.data;
    }
    throw new Error(tenant.data || "error looking up tenant");
  }
  async getSite(profile) {
    const tenant = await this.getTenant(profile);
    const site = tenant.sites.find((x) => x.id == profile.siteId);
    if (!site) {
      throw new Error("site not found");
    }
    return site;
  }
}
export default TenantManager;
