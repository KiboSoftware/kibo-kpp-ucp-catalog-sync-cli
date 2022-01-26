import fs from "fs";
import axios from "axios";
import fsPromises from "fs/promises";
import delay from "delay";
import ora from "ora";
import util from "util";
import fetch from "node-fetch";
import { pipeline } from "stream";
const streamPipeline = util.promisify(pipeline);

class ExportManager {
  constructor({ authenticator, tenantManager }) {
    this.authenticator = authenticator;
    this.tenantManager = tenantManager;
  }
  async getClient(profile) {
    const ticket = await this.authenticator.getTicket(profile);
    return axios.create({
      baseURL: `https://${profile.domain}/api`,
      headers: {
        Authorization: `Bearer ${ticket.access_token}`,
      },
    });
  }
  async poll(profile, id) {
    const client = await this.getClient(profile);
    let resp = null;
    console.log(`jobid: ${id}`);
    const spinner = ora("polling status:  waiting").start();
    while (true) {
      await delay(5000);
      resp = await client.get(`/platform/data/export/${id}`);
      if (resp.status != 200) {
        throw new Error(resp.data || "error reading export");
      }
      if (resp.data.isComplete) {
        break;
      }
      spinner.text = `polling status:  ${resp.data.status}`;
    }
    spinner.stop();

    console.log(`jobid: ${id}\nstatus:  ${resp.data.status}`);
    if (resp.data.statusMessage) {
      console.log(`statusMessage: ${resp.data.statusMessage}`);
    }
    if (resp.data.statusDetails) {
      console.log(`statusDetails: ${resp.data.statusDetails}`);
    }
    for (const sub of resp.data.resources || []) {
      console.log(
        `sub.status: ${sub.status} stateDetails:  ${sub.stateDetails}`
      );
    }
    const fileRes = resp.data.files.find((x) => x.fileType == "export");
    if (!fileRes) {
      throw new Error("export  not found");
    }
    const linkRes = await client.post(
      `/platform/data/files/${fileRes.id}/generatelink?hourDuration=24`
    );
    const s3Res = await fetch(linkRes.data);
    if (!s3Res.ok) throw new Error(`unexpected response ${s3Res.statusText}`);
    const fileName = `catalog-export-${new Date().toISOString()}.zip`;
    await streamPipeline(s3Res.body, fs.createWriteStream(fileName));
    console.log(`saved export to ${fileName}`);
  }
  async export(profile) {
    const tenant = await this.tenantManager.getTenant(profile);
    const site = tenant.sites.find((x) => x.id == profile.siteId);
    const masterCatalog = tenant.masterCatalogs.find((x) =>
      x.catalogs.some((y) => y.id == site.catalogId)
    );
    const client = await this.getClient(profile);
    const req = {
      name: "kibo-kpp-ucp-catalog-sync",
      domain: "catalog",
      contextOverride: {
        masterCatalog: masterCatalog.id,
        locale: site.localeCode,
        currency: site.countryCode,
        catalog: site.catalogId,
        site: site.id,
      },
      resources: [
        {
          resource: "GoogleProductSpec",
          format: "legacy",
        },
      ],
    };
    const exportResp = await client.post(`/platform/data/export`, req);
    if (exportResp.status != 200) {
      throw new Error(exportResp.data || "error creating export");
    }
    return exportResp.data;
  }
}

export default ExportManager;
