import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface ITeamMember {
  DisplayName: string;
  Email: string;
  JobTitle: string;
  PictureUrl: string;
  Mobile?: string;
  Department?: string;
  OfficeLocation?: string;
  Manager?: string;
}

/* Graph user type (only fields we use) */
interface IGraphUser {
  displayName?: string;
  mail?: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  mobilePhone?: string;

  manager?: {
    displayName?: string;
  };

  onPremisesExtensionAttributes?: {
    extensionAttribute4?: string;
  };
}

export default class UserProfileService {
  constructor(private context: WebPartContext) {}

  /* ---------------------------------------
   * Tenant users filtered by:
   * - SBU (default)
   * - Department (NEW)
   * --------------------------------------- */
  public async getTenantUsers(
    value: string,
    category?: string,
    onBatchLoaded?: (users: ITeamMember[]) => void
  ): Promise<ITeamMember[]> {

    if (!value) return [];

    const client = await this.context.msGraphClientFactory.getClient("3");

    const allMatched: ITeamMember[] = [];

    let requestUrl =
      "/users?$top=50&$select=displayName,mail,jobTitle,department,officeLocation,mobilePhone,onPremisesExtensionAttributes&$expand=manager($select=displayName)";

    while (requestUrl) {

      const response = await client.api(requestUrl).get();

      const users = response.value as IGraphUser[];

      const batch: ITeamMember[] = users
        .filter((u) => {
          if (!u.mail) return false;

          /* -----------------------------
             🔹 Department-based filtering
          ------------------------------*/
          if (category === "Department") {
            const userDept = u.department?.trim().toLowerCase() || "";
            return userDept === value.trim().toLowerCase();
          }

          /* -----------------------------
             🔹 Default SBU filtering
          ------------------------------*/
          const userSbu =
            u.onPremisesExtensionAttributes?.extensionAttribute4;

          if (!userSbu) return false;

          // Special case
          if (value === "HUMAN RESOURCES") {
            return userSbu === "HRD" || userSbu === "HRS";
          }

          return userSbu === value;
        })
        .map((u) => ({
          DisplayName: u.displayName ?? "",
          Email: u.mail ?? "",
          JobTitle: u.jobTitle ?? "",
          PictureUrl: `/_layouts/15/userphoto.aspx?size=L&username=${u.mail}`,
          Department: u.department,
          OfficeLocation: u.officeLocation,
          Mobile: u.mobilePhone,
          Manager: u.manager?.displayName
        }));

      if (batch.length > 0) {
        allMatched.push(...batch);

        // 🔹 Progressive UI update
        onBatchLoaded?.(batch);
      }

      requestUrl = response["@odata.nextLink"] ?? null;
    }

    return allMatched;
  }
}