/* eslint-disable @typescript-eslint/no-explicit-any */

import { SPFI, spfi, SPFx } from "@pnp/sp";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/folders";
import "@pnp/sp/files";

export class StaffPostingService {

  //private sp: SPFI;
  private publishingHubSp: SPFI;

  private readonly PUBLISHING_HUB_URL: string;

  constructor(sp: SPFI, context: WebPartContext) {
    const currentUrl = context.pageContext.web.absoluteUrl.toLowerCase();
    if (currentUrl.includes("dev-")) {
      this.PUBLISHING_HUB_URL =
        "https://bharatpetroleum.sharepoint.com/sites/dev-corporate-publishing-hub";
    } else if (currentUrl.includes("qa-")) {
      this.PUBLISHING_HUB_URL =
        "https://bharatpetroleum.sharepoint.com/sites/qa-corporate-publishing-hub";
    } else {
      this.PUBLISHING_HUB_URL =
        "https://bharatpetroleum.sharepoint.com/sites/iconnect-corporate-publishing-hub";
    }
    
    this.publishingHubSp = spfi(this.PUBLISHING_HUB_URL).using(SPFx(context));

  }

  /* =========================================================
     1️⃣ Check if NewsType is StaffPosting
  ========================================================== */
  public async isStaffPosting(itemId: number): Promise<boolean> {
    try {

      const item = await this.publishingHubSp.web.lists
        .getByTitle("CorpCommunication")
        .items
        .getById(itemId)
        .select("Id", "NewsTypes")();

      return item?.NewsType === "StaffPosting";

    } catch (error) {
      console.error("Something went wrong. Please contact administrator.");
      return false;
    }
  }


  /* =========================================================
     2️⃣ Fetch Images From TransferListImages Library
        Folder Name = ItemId
  ========================================================== */
  public async getTransferImagesByItemId(itemId: number): Promise<any[]> {
    try {

      const folderName = itemId.toString();

      const folder = this.publishingHubSp.web.getFolderByServerRelativePath(
        `TransferListImages/${folderName}`
      );

      const files = await folder.files();

      return files || [];

    } catch (error) {
      console.error("Something went wrong. Please contact administrator.");
      return [];
    }
  }


  /* =========================================================
     3️⃣ Fetch Dropdown Values From TransferSbuIndexList
        Folder Name = ItemId
  ========================================================== */
  public async getTransferSbuIndexesByItemId(itemId: number): Promise<any[]> {
    try {
      const listTitle = "TransferSbuIndexList";
      const folderTitle = itemId.toString();

      // 1️⃣ Get real folder path (FileRef) using Title
      const folderItems = await this.publishingHubSp.web.lists
        .getByTitle(listTitle)
        .items
        .filter(`Title eq '${folderTitle}' and FSObjType eq 1`)
        .select("FileRef")
        ();

      if (!folderItems || folderItems.length === 0) {
        console.log("Something went wrong. Please contact administrator.");
        return [];
      }

      const realFolderPath = folderItems[0].FileRef;
      // 2️⃣ Get items inside that folder using real internal path
      const items = await this.publishingHubSp.web.lists
        .getByTitle(listTitle)
        .items
        .select("Id", "StartIndex", "SBU/Id", "SBU/TeamName", "FileDirRef")
        .expand("SBU")
        .filter(`startswith(FileDirRef,'${realFolderPath}')`)
        .orderBy("Id", true)();

      return items || [];

    } catch (error) {
      console.error("Something went wrong. Please contact administrator.");
      return [];
    }
  }


  /* =========================================================
     4️⃣ Combined Loader (Optional Helper)
  ========================================================== */
  public async loadStaffPostingData(itemId: number): Promise<{
    images: any[];
    sbuOptions: any[];
  }> {

    try {

      const [images, sbuOptions] = await Promise.all([
        this.getTransferImagesByItemId(itemId),
        this.getTransferSbuIndexesByItemId(itemId)
      ]);

      return {
        images,
        sbuOptions
      };

    } catch (error) {
      console.error("Something went wrong. Please contact administrator.");
      return {
        images: [],
        sbuOptions: []
      };
    }
  }


}