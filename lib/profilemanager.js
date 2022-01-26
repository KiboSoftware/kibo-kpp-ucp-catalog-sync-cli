import os from "os";
import path from "path";
import fs from "fs";
const fsPromises = fs.promises;
const subDir = ".kibo-kpp-ucp-catalog-sync";

class ProfileManager {
  constructor() {
    this.baseDir = path.join(os.homedir(), subDir);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir);
    }
  }
  list() {
    return fsPromises.readdir(this.baseDir);
  }
  save(profile) {
    const data = JSON.stringify(profile);
    const file = path.join(this.baseDir, profile.name);
    return fsPromises.writeFile(file, data);
  }
  async get(profile) {
    const file = path.join(this.baseDir, profile);
    const data = (await fsPromises.readFile(file)).toString();
    return JSON.parse(data);
  }
}

export default ProfileManager;
