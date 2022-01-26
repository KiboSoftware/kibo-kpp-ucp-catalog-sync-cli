import inquirer from "inquirer";
const newProfileAnswer = "[Create New Profile!]";
class ProfileInquirer {
  constructor({ profileManager, tenantManager }) {
    this.profileManager = profileManager;
    this.tenantManager = tenantManager;
  }
  async askProfile() {
    const profileChoices = await this.profileManager.list();
    profileChoices.push(newProfileAnswer);

    const question = {
      type: "list",
      name: "profile",
      message: "Choose a Profile",
      choices: profileChoices,
      default: newProfileAnswer,
    };
    const profileId = (await inquirer.prompt(question)).profile;
    if (profileId === newProfileAnswer) {
      const profile = await this.createProfile();  
      await this.profileManager.save(profile);
      return profile;
    } else {
      return await this.profileManager.get(profileId);
    }
  }
  async createProfile() {
    const questions = [
      {
        type: "input",
        name: "name",
        message: "who is for [name]?",
        validate(value) {
          return value.length > 0 || "Enter value";
        },
      },
      {
        type: "input",
        name: "appKey",
        message: "Kibo DevCenter APPLICATION KEY",
        validate(value) {
          return value.length > 0 || "Enter value";
        },
      },
      {
        type: "input",
        name: "sharedSecret",
        message: "Kibo DevCenter SHARED SECRET",
        validate(value) {
          return value.length > 0 || "Enter value";
        },
      },
      {
        type: "input",
        name: "tenantId",
        message: "Kibo Tenant Id",
        validate(value) {
          const valid = !isNaN(parseFloat(value));
          return valid || "Please enter a number";
        },
      },
      {
        type: "input",
        name: "siteId",
        message: "Kibo Site Id",
        validate(value) {
          const valid = !isNaN(parseFloat(value));
          return valid || "Please enter a number";
        },
      },
    ];
    const profileResult = await inquirer.prompt(questions);
    profileResult.tenantId = parseInt(profileResult.tenantId);
    profileResult.siteId = parseInt(profileResult.siteId);
    profileResult.domain = (
      await this.tenantManager.getSite(profileResult)
    ).domain;
    return profileResult;
  }
}
export default ProfileInquirer;
