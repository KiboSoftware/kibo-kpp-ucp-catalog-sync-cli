import fs from "fs";
import axios from "axios";
import fsPromises from "fs/promises";
import delay from "delay";
import ora from "ora";
import fetch from "node-fetch";

class ImportManager {
  constructor({ authenticator, tenantManager }) {
    this.authenticator = authenticator;
    this.tenantManager = tenantManager;
  }
  validateFile(file) {
    if (!/^.*\.zip$/gm.test(file)) {
      throw new Error(`only zip files allowed`);
    }
    if (!fs.existsSync(file)) {
      throw new Error(`can't find ${file}`);
    }
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

  async poll(profile, importId) {
    const client = await this.getClient(profile);
    let resp = null;
    console.log(`jobid: ${importId}`);
    const spinner = ora("polling status:  waiting").start();
    while (true) {
      await delay(5000);
      resp = await client.get(`/platform/data/import/${importId}`);
      if (resp.status != 200) {
        throw new Error(importResp.data || "error reading import");
      }
      if (resp.data.isComplete) {
        break;
      }
      spinner.text = `polling status:  ${resp.data.status}`;
    }
    spinner.stop();

    console.log(`status:  ${resp.data.status}`);
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
  }
  async import(profile, file) {
    this.validateFile(file);

    const tenant = await this.tenantManager.getTenant(profile);
    const site = tenant.sites.find((x) => x.id == profile.siteId);
    const masterCatalog = tenant.masterCatalogs.find((x) =>
      x.catalogs.some((y) => y.id == site.catalogId)
    );
    const instance = await this.getClient(profile);
    const blob = await fsPromises.readFile(file);

    const ticket = await this.authenticator.getTicket(profile);

    const data = await fsPromises.readFile(file);

    const fileFetchRes = await fetch(
      `https://${profile.domain}/api/platform/data/files?fileType=import&fileName=catalog.zip`,
      {
        headers: {
          Authorization: `Bearer ${ticket.access_token}`,
        },
        method: "POST",
        body: data,
      }
    );

    if (fileFetchRes.status != 200) {
      throw new Error(fileRes.data || "error posting file");
    }
    const fileRes = await fileFetchRes.json();

    const req = {
      name: "kibo-kpp-ucp-catalog-sync",
      domain: "catalog",
      resources: [
        {
          format: "GoogleProductSpec",
          resource: "GoogleProductSpec",
        },
      ],
      contextOverride: {
        masterCatalog: masterCatalog.id,
        locale: site.localeCode,
        currency: site.countryCode,
        catalog: site.catalogId,
        site: site.id,
      },
      files: [
        {
          id: fileRes.id,
          locationType: "internal",
          fileName: "catalog.zip",
          fileType: "import",
        },
      ],
    };

    const importResp = await instance.post(`/platform/data/import`, req);
    if (importResp.status != 200) {
      throw new Error(importResp.data || "error creating import");
    }
    return importResp.data;
  }
}

export default ImportManager;
