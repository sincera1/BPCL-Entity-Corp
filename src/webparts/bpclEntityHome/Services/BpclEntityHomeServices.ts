import { spfi, SPFx, SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/attachments";
import "@pnp/sp/site-users/web";
import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface INavigationMenuItem {
    Id: number;
    Title: string;
    MenuUrl: {
        Url: string;
        Description: string;
    };

    ParentId?: {
        Id: number;
        Title: string;
    };
    Sequence?: number;
}

export interface IWelcomeBannerItem {
    Id: number;
    Title: string;
    Description: string;
    ImageUrl: string;
    RedirectURL?: {
        Url: string;
        Description: string;
    };
}

export interface IQuickLinkItem {
    Id: number;
    Title: string;
    DisplayOrder: number;
    RedirectURL: {
        Url: string;
        Description: string;
    };
    ImageUrl?: string;
}

export interface IDirectorCornerItem {
    Id: number;
    Title: string;
    Designation: string;
    Message: string;
    ImageUrl?: string;
    GalleryImages?: string[];
}

export interface IHighlightItem {
    Id: number;
    Title: string;
    Description: string;
    ImageUrl: string;
    RedirectURL: string;
}

export interface ICorporateNewsItem {
    Id: number;
    Title: string;
    PublishedDate: string;
    ImageUrl: string;
    LikesCount: number;
    liked?: boolean;
    NewsTypes?: {
        WssId?: number;
        TermGuid?: string;
        Label?: string;
    };
    MainDescription?: string;
}

export interface IBroadcastItem {
    Id: number;
    Title: string;
    BroadcastType: {
        Label: string;
        TermGuid: string;
    };
    IconUrl: string;
}

export interface IAwardItem {
    Id: number;
    Title: string;
    Description: string;
    ImageUrl: string;
    RedirectURL: string;
}

export interface IGovernanceItem {
    Id: number;
    Title: string;
    Description: string;
    ImageUrl: string;
    RedirectURL: string;
}

export interface IBUContactUsItem {
    Id: number;
    ContactTitle: string;
    ContactDesc: string;
    RedirectURL: string;
    ImageUrl: string;
}

export interface IVMVItem {
    Id: number;
    Title: string;
    Description: string;
    ImageUrl?: string;
    RedirectURL: string;

}

export interface IBusinessUnitItem {
    Id: number;
    Title: string;
    ImageUrl: string;
    RedirectURL: string;
}

export interface IAttachment {
    FileName: string;
    ServerRelativeUrl: string;
}

export interface INewsPreviewItem {
    Id: number;
    Title: string;
    PublishedDate: string;
    MainDescription?: string;
    Thumbnail?: string;
    Picture1?: string;
    Picture2?: string;
    Picture3?: string;
    ThumbnailCaption?: string;
    Pic1Caption?: string;
    Pic2Caption?: string;
    Pic3Caption?: string;
    NewsTypes?: {
        WssId?: number;
        TermGuid?: string;
        Label?: string;
    };

}

export interface IEventPreviewItem {
    Id: number;
    Title: string;
    liked?: boolean;
    PublishedDate?: string;
    MainDescription?: string;
    Thumbnail?: string;
    Picture1?: string;
    Picture2?: string;
    Picture3?: string;
    ThumbnailCaption?: string;
}



export default class BpclEntityHomeServices {
    private sp: SPFI;
    public publishingHubSp: SPFI;
    private siteUrl: string;
    private context: WebPartContext;
    private publishingHubUserId!: number;

    private readonly PUBLISHING_HUB_URL: string;


    constructor(context: WebPartContext) {

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

        this.context = context;
        this.sp = spfi().using(SPFx(context));
        this.publishingHubSp = spfi(this.PUBLISHING_HUB_URL).using(SPFx(context));
        this.siteUrl = context.pageContext.web.absoluteUrl;
    }




    public async getNavigationMenu(): Promise<INavigationMenuItem[]> {
        const items = await this.sp.web.lists
            .getByTitle("Entity_SL_NavigationMenu")
            .items
            .select(
                "Id",
                "Title",
                "MenuUrl",
                "Sequence",
                "ParentId/Id",
                "ParentId/Title"
            )
            .expand("ParentId")
            .filter("IsActive eq 1")
            .orderBy("Sequence", true)();

        return items;
    }


    public async getQuickLinks(): Promise<IQuickLinkItem[]> {
        const items = await this.sp.web.lists
            .getByTitle("Entity_SL_QuickLinks")
            .items
            .select("Id", "Title", "DisplayOrder", "RedirectURL", "CoverImage")
            .filter("IsActive eq 1")
            .orderBy("DisplayOrder", true)();

        return items.map(item => {
            let imageUrl: string | undefined;

            if (item.CoverImage) {
                try {
                    const img = JSON.parse(item.CoverImage);


                    if (img.serverRelativeUrl) {
                        imageUrl = img.serverRelativeUrl;
                    }

                    else if (img.fileName) {
                        imageUrl = `${this.siteUrl}/Lists/Entity_SL_QuickLinks/Attachments/${item.Id}/${img.fileName}`;
                    }
                } catch {
                    imageUrl = undefined;
                }
            }

            return {
                Id: item.Id,
                Title: item.Title,
                DisplayOrder: item.DisplayOrder,
                RedirectURL: item.RedirectURL,
                ImageUrl: imageUrl
            };
        });
    }

    private async getCurrentUserId(): Promise<number> {

        if (!this.publishingHubUserId) {

            // Get logged-in user email from current site
            const currentUser = await this.sp.web.currentUser
                .select("Email")();

            // Ensure the user exists in Publishing Hub site
            const ensuredUser = await this.publishingHubSp.web.ensureUser(currentUser.Email);

            // Store Publishing Hub user ID
            this.publishingHubUserId = ensuredUser.Id;
        }

        return this.publishingHubUserId;
    }


    public async getWelcomeBanners(): Promise<IWelcomeBannerItem[]> {



        const items = await this.sp.web.lists
            .getByTitle("Entity_DL_WelcomeBanner")
            .items
            .select(
                "Id",
                "WelcomeBannerTitle",
                "WelcomeBannerDesc",
                "RedirectURL",
                "FileRef"
            )
            .orderBy("Id", false)
            .top(15)();

        return items.map(item => ({
            Id: item.Id,
            Title: item.WelcomeBannerTitle,
            Description: item.WelcomeBannerDesc,
            ImageUrl: encodeURI(item.FileRef),
            RedirectURL: item.RedirectURL
        }));
    }

    private getImageFromField(
        imageFieldValue: string | null,
        attachments: IAttachment[]
    ): string | null {
        if (!imageFieldValue || !attachments || attachments.length === 0) {
            return null;
        }

        try {
            const imgMeta = JSON.parse(imageFieldValue);
            const fileName = imgMeta?.fileName;

            for (let i = 0; i < attachments.length; i++) {
                if (attachments[i].FileName === fileName) {
                    return attachments[i].ServerRelativeUrl;
                }
            }

            return null;
        } catch {
            return null;
        }
    }

    public async getDirectorCorner(): Promise<IDirectorCornerItem[]> {

        const items = await this.sp.web.lists
            .getByTitle("Entity_DirectorCorner")
            .items
            .select(
                "Id",
                "Title",
                "Designation",
                "Message",
                "CoverImage",
                "Image1",
                "Image2",
                "Image3",
                "Image4",
                "Image5",
                "AttachmentFiles",
                "IsActive"
            )
            .expand("AttachmentFiles")
            .filter("IsActive eq 1")();

        return items.map(item => {

            const attachments = item.AttachmentFiles || [];

            // 🔹 Cover image (normal view)
            const coverImageUrl =
                this.getImageFromField(item.CoverImage, attachments) || undefined;

            // 🔹 Gallery images (popup)
            const galleryImages = [
                item.CoverImage,
                item.Image1,
                item.Image2,
                item.Image3,
                item.Image4,
                item.Image5
            ]
                .map(imgField => this.getImageFromField(imgField, attachments))
                .filter((url): url is string => !!url); // remove nulls

            return {
                Id: item.Id,
                Title: item.Title,
                Designation: item.Designation,
                Message: item.Message,
                ImageUrl: coverImageUrl,
                GalleryImages: galleryImages
            };
        });
    }

    public async getPerformanceHighlights(): Promise<IHighlightItem[]> {
        const items = await this.sp.web.lists
            .getByTitle("Entity_DL_PerformanceHighlights")
            .items
            .select(
                "Id",
                "PerformanceHighlightsTitle",
                "PerformanceHighlightsDesc",
                "CoverImage",
                "FileRef",
                "IsActive"
            )
            .filter("IsActive eq 1")
            .orderBy("Id", false)
            .top(15)();

        return items.map(item => {
            let imageUrl = "";

            if (item.CoverImage) {
                try {
                    const img = JSON.parse(item.CoverImage);
                    imageUrl = img.serverRelativeUrl || "";
                } catch (error) {
                    console.error("Something went wrong. Please contact administrator.");
                }
            }

            return {
                Id: item.Id,
                Title: item.PerformanceHighlightsTitle,
                Description: item.PerformanceHighlightsDesc,
                ImageUrl: imageUrl,
                RedirectURL: item.FileRef
            };
        });
    }

    public async getSuccessStories(): Promise<IHighlightItem[]> {
        const items = await this.sp.web.lists
            .getByTitle("Entity_DL_SuccessStories")
            .items
            .select(
                "Id",
                "SuccessStoriesTitle",
                "SuccessStoriesDesc",
                "CoverImage",
                "FileRef",
                "IsActive"
            )
            .filter("IsActive eq 1")
            .orderBy("Id", false)
            .top(15)();

        return items.map(item => {
            let imageUrl = "";

            if (item.CoverImage) {
                try {
                    const img = JSON.parse(item.CoverImage);
                    imageUrl = img.serverRelativeUrl || "";
                } catch (error) {
                    console.error("Something went wrong. Please contact administrator.");
                }
            }

            return {
                Id: item.Id,
                Title: item.SuccessStoriesTitle,
                Description: item.SuccessStoriesDesc,
                ImageUrl: imageUrl,
                RedirectURL: item.FileRef
            };
        });
    }

    public async getTestimonials(): Promise<IHighlightItem[]> {
        const items = await this.sp.web.lists
            .getByTitle("Entity_DL_Testimonials")
            .items
            .select(
                "Id",
                "TestimonialsTitle",
                "TestimonialsDesc",
                "CoverImage",
                "FileRef",
                "IsActive"
            )
            .filter("IsActive eq 1")
            .orderBy("Id", false)
            .top(15)();

        return items.map(item => {
            let imageUrl = "";

            if (item.CoverImage) {
                try {
                    const img = JSON.parse(item.CoverImage);
                    imageUrl = img.serverRelativeUrl || "";
                } catch (error) {
                    console.error("Something went wrong. Please contact administrator.");
                }
            }

            return {
                Id: item.Id,
                Title: item.TestimonialsTitle,
                Description: item.TestimonialsDesc,
                ImageUrl: imageUrl,
                RedirectURL: item.FileRef
            };
        });
    }


    public async getAwards(): Promise<IAwardItem[]> {
        const items = await this.sp.web.lists
            .getByTitle("Entity_DL_Awards")
            .items
            .select(
                "Id",
                "AwardsTitle",
                "AwardsDesc",
                "CoverImage",
                "FileRef",
                "IsActive"

            )
            .filter("IsActive eq 1")
            .orderBy("Id", false)
            .top(15)();

        return items.map(item => {
            let imageUrl = "";

            if (item.CoverImage) {
                try {
                    const img = JSON.parse(item.CoverImage);
                    imageUrl = img.serverRelativeUrl || "";
                } catch {
                    imageUrl = "";
                }
            }

            return {
                Id: item.Id,
                Title: item.AwardsTitle,
                Description: item.AwardsDesc,
                ImageUrl: imageUrl,
                RedirectURL: item.FileRef
            };
        });
    }

    public async getGovernanceCarousel(): Promise<IGovernanceItem[]> {
        const items = await this.sp.web.lists
            .getByTitle("Entity_DL_GovernanceCarousel")
            .items
            .select(
                "Id",
                "GovernanceTitle",
                "GovernanceDesc",
                "CoverImage",
                "FileRef",
                "IsActive"
            )
            .filter("IsActive eq 1")
            .orderBy("Id", false)
            .top(15)();

        return items.map(item => {
            let imageUrl = "";

            if (item.CoverImage) {
                try {
                    const img = JSON.parse(item.CoverImage);
                    imageUrl = img.serverRelativeUrl || "";
                } catch {
                    imageUrl = "";
                }
            }

            return {
                Id: item.Id,
                Title: item.GovernanceTitle,
                Description: item.GovernanceDesc,
                ImageUrl: imageUrl,
                RedirectURL: item.FileRef
            };
        });
    }

    private async getUserGroups(): Promise<Set<string>> {

        const client = await this.context.msGraphClientFactory.getClient("3");

        let requestUrl: string | null = "/me/transitiveMemberOf?$select=displayName";
        const userGroups = new Set<string>();

        while (requestUrl) {

            const response = await client.api(requestUrl).get();

            if (response.value) {
                response.value.forEach((g: { displayName?: string }) => {
                    if (g.displayName) {
                        userGroups.add(g.displayName);
                    }
                });
            }

            requestUrl = response["@odata.nextLink"]
                ? response["@odata.nextLink"].replace("https://graph.microsoft.com/v1.0", "")
                : null;
        }

        return userGroups;
    }

    public async getBroadcasts(sbu?: string, category?: string): Promise<IBroadcastItem[]> {


        let filterQueryPart = "";

        if (category === "Department") {
            filterQueryPart = sbu ? ` and Department eq '${sbu}'` : "";
        } else {
            filterQueryPart = sbu
                ? sbu === "HUMAN RESOURCES"
                    ? ` and (SBU eq 'HRD' or SBU eq 'HRS')`
                    : ` and SBU eq '${sbu}'`
                : "";
        }

        const filterQuery =
            `Created ge datetime'2024-08-01T00:00:00Z' and CommunicationType eq 'BroadCast' and Status eq 'Published'` +
            filterQueryPart;

        const userGroups = await this.getUserGroups();
        const currentUserId = await this.getCurrentUserId();
        const [items, iconMap] = await Promise.all([

            this.publishingHubSp.web.lists
                .getByTitle("CorpCommunication")
                .items
                .select(
                    "Id",
                    "Title",
                    "PublishedDate",
                    "BroadcastType/Label",
                    "BroadcastType/TermGuid",
                    "DLGroup/Id",
                    "DLGroup/Title"
                )
                .expand("DLGroup")
                .filter(filterQuery)
                .orderBy("PublishedDate", false)
                .top(100)(),

            this.getBroadcastIcons()
        ]);

        const filteredItems: {
            Id: number;
            Title: string;
            PublishedDate: string;
            BroadcastType?: { Label?: string; TermGuid?: string };
            DLGroup?: { Title?: string }[];
        }[] = [];

        for (const item of items) {

            

            if (filteredItems.length === 15) break;

            if (!item.DLGroup || item.DLGroup.length === 0) {
                filteredItems.push(item);
                continue;
            }

            let hasAccess = false;

            const dlGroups = Array.isArray(item.DLGroup) ? item.DLGroup : [item.DLGroup];

            for (const dl of dlGroups) {

                if (!dl) continue;

                // ✅ 1. Direct user check
                if (dl.Id === currentUserId) {
                    hasAccess = true;
                    break;
                }

                // ✅ 2. Group check
                if (dl.Title && userGroups.has(dl.Title)) {
                    hasAccess = true;
                    break;
                }
            }

            if (hasAccess) {
                filteredItems.push(item);
            }
        }

        
        return filteredItems

            .slice(0, 15)
            .map(item => ({
                Id: item.Id,
                Title: item.Title,
                PublishedDate: item.PublishedDate,
                BroadcastType: {
                    Label: item.BroadcastType?.Label || "",
                    TermGuid: (item as any).BroadcastType?.[0].TermGuid || ""
                },
                IconUrl: (item as any).BroadcastType?.[0].TermGuid
                    ? iconMap.get((item as any).BroadcastType?.[0].TermGuid) || ""
                    : ""
                    
            }));

        


    }

    private async getBroadcastIcons(): Promise<Map<string, string>> {

        const items = await this.publishingHubSp.web.lists
            .getByTitle("BroadCastIcons")
            .items
            .select(
                "FileRef",
                "BroadcastType/TermGuid"
            )();
        const iconMap = new Map<string, string>();

        items.forEach(item => {


            if (item.BroadcastType?.TermGuid) {
                iconMap.set(item.BroadcastType?.TermGuid, item.FileRef);
            }
        });

        return iconMap;
    }

    public async getEvents(sbu?: string, category?: string): Promise<ICorporateNewsItem[]> {

        const userGroups = await this.getUserGroups();
        const currentUserId = await this.getCurrentUserId();

        let filterQueryPart = "";

        if (category === "Department") {
            filterQueryPart = sbu ? ` and Department eq '${sbu}'` : "";
        } else {
            filterQueryPart = sbu
                ? sbu === "HUMAN RESOURCES"
                    ? ` and (SBU eq 'HRD' or SBU eq 'HRS')`
                    : ` and SBU eq '${sbu}'`
                : "";
        }


        const filterQuery =
            `Created ge datetime'2024-08-01T00:00:00Z' and CommunicationType eq 'Event' and Status eq 'Published'` +
            filterQueryPart;

        const items = await this.publishingHubSp.web.lists
            .getByTitle("CorpCommunication")
            .items.select(
                "Id",
                "Title",
                "PublishedDate",
                "LikesCount",
                "LikedBy/Id",
                "AttachmentFiles",
                "ThumbnailCaption",
                "DLGroup/Id",
                "DLGroup/Title"
            )
            .expand("AttachmentFiles", "LikedBy", "DLGroup")
            .filter(filterQuery)
            .orderBy("PublishedDate", false)
            .top(100)();

        const filteredItems: any[] = [];

        for (const item of items) {

            if (filteredItems.length === 15) break;

            // ✅ Public (no DLGroup)
            if (!item.DLGroup || item.DLGroup.length === 0) {
                filteredItems.push(item);
                continue;
            }

            let hasAccess = false;

            const dlGroups = Array.isArray(item.DLGroup)
                ? item.DLGroup
                : item.DLGroup
                    ? [item.DLGroup]
                    : [];

            for (const dl of dlGroups) {

                if (!dl) continue;

                // ✅ Direct user
                if (dl.Id === currentUserId) {
                    hasAccess = true;
                    break;
                }

                // ✅ Group membership
                if (dl.Title && userGroups.has(dl.Title)) {
                    hasAccess = true;
                    break;
                }
            }

            if (hasAccess) {
                filteredItems.push(item);
            }
        }

        return filteredItems.map(item => {

            const likedUsers = item.LikedBy
                ? item.LikedBy.map((u: { Id: number }) => u.Id)
                : [];

            const isLiked = likedUsers.includes(currentUserId);

            return {
                Id: item.Id,
                Title: item.Title,
                PublishedDate: item.PublishedDate,
                LikesCount: item.LikesCount ?? 0,
                ImageUrl:
                    item.AttachmentFiles && item.AttachmentFiles.length > 0
                        ? item.AttachmentFiles[0].ServerRelativeUrl
                        : "",
                liked: isLiked,
                ThumbnailCaption: item.ThumbnailCaption
            };
        });
    }

    public async toggleLike(
        itemId: number,
        isLiked: boolean
    ): Promise<number> {

        const currentUserId = await this.getCurrentUserId();

        const list = this.publishingHubSp.web.lists.getByTitle("CorpCommunication");
        const itemRef = list.items.getById(itemId);

        const item = await itemRef
            .select("LikedBy/Id")
            .expand("LikedBy")();

        let likedUsers: number[] = item.LikedBy
            ? item.LikedBy.map((u: { Id: number }) => u.Id)
            : [];

        // Remove like
        if (isLiked) {
            likedUsers = likedUsers.filter(id => id !== currentUserId);
        }
        // Add like
        else if (!likedUsers.includes(currentUserId)) {
            likedUsers.push(currentUserId);
        }

        const updatedLikes = likedUsers.length;

        await itemRef.update({
            LikesCount: updatedLikes,
            LikedById: likedUsers
        });

        return updatedLikes;
    }

    private async getTaxonomyLabelByWssId(wssId: number): Promise<string> {
        if (!wssId) return "";

        try {
            const items = await this.publishingHubSp.web.lists
                .getByTitle("TaxonomyHiddenList")
                .items
                .filter(`ID eq ${wssId}`)
                .select("Id", "Term")();

            return items.length > 0 ? items[0].Title : "";
        } catch (error) {
            console.error("Something went wrong. Please contact administrator.");
            return "";
        }
    }

    public async getCorporateNews(sbu?: string, category?: string): Promise<ICorporateNewsItem[]> {
        let filterQueryPart = "";

        if (category === "Department") {
            filterQueryPart = sbu ? ` and Department eq '${sbu}'` : "";
        } else {
            filterQueryPart = sbu
                ? sbu === "HUMAN RESOURCES"
                    ? ` and (SBU eq 'HRD' or SBU eq 'HRS')`
                    : ` and SBU eq '${sbu}'`
                : "";
        }

        const filterQuery =
            `Created ge datetime'2024-08-01T00:00:00Z' and CommunicationType eq 'News' and Status eq 'Published' and PublishIn eq 'Corporate'` +
            filterQueryPart;

        const items = await this.publishingHubSp.web.lists
            .getByTitle("CorpCommunication")
            .items
            .select(
                "Id",
                "Title",
                "PublishedDate",
                "LikesCount",
                "Thumbnail",
                "NewsTypes",
                "NewsTypes/Label",
                "LikedBy/Id",

                "AttachmentFiles"
            )
            .expand("AttachmentFiles", "LikedBy")
            .filter(filterQuery)
            .orderBy("PublishedDate", false)
            .top(15)();

        const currentUserId = await this.getCurrentUserId();

        const results = await Promise.all(
            items.map(async (item) => {

                const imageRelativeUrl = this.getThumbnailFromAttachments(
                    item.AttachmentFiles,
                    item.Thumbnail
                );

                const resolvedLabel = await this.getTaxonomyLabelByWssId(
                    item.NewsTypes?.WssId
                );

                const likedUsers = item.LikedBy
                    ? item.LikedBy.map((u: { Id: number }) => u.Id)
                    : [];

                const isLiked = likedUsers.includes(currentUserId);

                return {
                    Id: item.Id,
                    Title: item.Title,
                    PublishedDate: item.PublishedDate,
                    LikesCount: item.LikesCount ? item.LikesCount : 0,
                    ImageUrl: imageRelativeUrl,
                    liked: isLiked,
                    newsType: resolvedLabel
                };
            })
        );

        return results;
    }


    private getThumbnailFromAttachments(
        attachmentFiles: IAttachment[],
        thumbnailFileName: string
    ): string {

        if (!attachmentFiles || attachmentFiles.length === 0) {
            return "";
        }

        // If thumbnail name is available, try to match it
        if (thumbnailFileName) {
            for (let i = 0; i < attachmentFiles.length; i++) {
                if (
                    attachmentFiles[i].FileName &&
                    attachmentFiles[i].FileName.toLowerCase() === thumbnailFileName.toLowerCase()
                ) {
                    return attachmentFiles[i].ServerRelativeUrl;
                }
            }
        }

        // If thumbnail is blank or not found → return first attachment
        return attachmentFiles[0].ServerRelativeUrl;
    }

    public async getContactUsSlides(): Promise<IBUContactUsItem[]> {
        const items = await this.sp.web.lists
            .getByTitle("Entity_DL_ContactUs")
            .items.select(
                "Id",
                "ContactTitle",
                "ContactDesc",
                "RedirectURL",
                "FileRef"
            )();

        return items.map(item => ({
            Id: item.Id,
            ContactTitle: item.ContactTitle,
            ContactDesc: item.ContactDesc,
            RedirectURL: item.RedirectURL,
            ImageUrl: item.FileRef
        }));
    }



    public async getVisionMissionValues(): Promise<IVMVItem[]> {
        const items = await this.sp.web.lists
            .getByTitle("Entity_DL_VisionMissionValues")
            .items
            .select("Id", "VMVTitle", "VMVDesc", "CoverImage", "FileRef")();

        return items.map(item => {
            let imageUrl: string | undefined;

            if (item.CoverImage) {
                try {
                    const img = JSON.parse(item.CoverImage);
                    if (img.serverRelativeUrl) {
                        imageUrl = img.serverRelativeUrl;
                    }
                } catch {
                    imageUrl = undefined;
                }
            }

            return {
                Id: item.Id,
                Title: item.VMVTitle,
                Description: item.VMVDesc,
                ImageUrl: imageUrl,
                RedirectURL: item.FileRef
            };
        });
    }


    public async getBusinessUnits(): Promise<IBusinessUnitItem[]> {
        const items = await this.sp.web.lists
            .getByTitle("Entity_DL_BusinessUnitsCarousel")
            .items
            .select(
                "Id",
                "BUTitle",
                "RedirectURL",
                "FileRef"
            )
            .orderBy("Id", false)
            .top(15)();

        return items.map(item => ({
            Id: item.Id,
            Title: item.BUTitle,
            ImageUrl: item.FileRef,
            RedirectURL: item.RedirectURL
        }));
    }

    public async getAttachments(itemId: number): Promise<IAttachment[]> {
        try {
            return await this.publishingHubSp.web.lists
                .getByTitle("CorpCommunication")
                .items.getById(itemId)
                .attachmentFiles();
        } catch (error) {
            console.error("Something went wrong. Please contact administrator.");
            return [];
        }
    }

    public async getNewsPreviewItem(itemId: number): Promise<INewsPreviewItem | undefined> {
        try {
            const item = await this.publishingHubSp.web.lists
                .getByTitle("CorpCommunication")
                .items
                .getById(itemId)
                .select(
                    "Id",
                    "Title",
                    "EventDate",
                    "MainDescription",
                    "NewsTypes",
                    "NewsTypes/Label",
                    "Thumbnail",
                    "Picture1",
                    "Picture2",
                    "Picture3",
                    "ThumbnailCaption",
                    "Pic1Caption",
                    "Pic2Caption",
                    "Pic3Caption"
                )();

            return item;
        } catch (error) {
            console.error("Something went wrong. Please contact administrator.");
            return undefined;
        }
    }

    public async getEventPreviewItem(itemId: number): Promise<IEventPreviewItem | undefined> {
        try {
            const item = await this.publishingHubSp.web.lists
                .getByTitle("CorpCommunication")
                .items
                .getById(itemId)
                .select(
                    "Id",
                    "Title",
                    "PublishedDate",
                    "MainDescription",
                    "Thumbnail",
                    "Picture1",
                    "Picture2",
                    "Picture3",
                    "ThumbnailCaption"
                )();

            return item;
        } catch (error) {
            console.error("Something went wrong. Please contact administrator.");
            return undefined;
        }
    }



}
