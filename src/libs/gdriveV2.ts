import { BaseUrlResolver, ResolvedMediaItem } from "../BaseResolver";
import { parseHiddenForm } from "../utils/helper";

export class gDriveV2Resolver extends BaseUrlResolver {
    private googleDriveId: string;
    constructor() {
        super({
            domains: [/https?:\/\/(drive|docs)\.google\.com/],
            speedRank: 99
        });
        this.googleDriveId = '';
    }

    async resolveInner(_urlToResolve: string): Promise<ResolvedMediaItem[]> {
        const links = [];

        const rx0 = /(drive|docs)\.google\.com\/open\?id=(.*)/
        const rx1 = /(drive|docs)\.google\.com\/file\/d\/(.*?)\//
        const rx2 = /(drive|docs)\.google\.com\/uc\?id=(.*?)&/

        const regexresult = rx0.exec(_urlToResolve) || rx1.exec(_urlToResolve) || rx2.exec(_urlToResolve)
        if (regexresult) {
            const normalizeDriveUrl = `https://drive.google.com/uc?id=${regexresult[2]}&export=download`;
            this.googleDriveId = regexresult[2];
            const response = await this.gotInstance(normalizeDriveUrl, {
                followRedirect: false
            });

            const { title } = this.scrapeHtml(response.body, {
                title: 'span.uc-name-size a'
            }) as { title: string };

            const parsedForm = parseHiddenForm(response.body);
            const reqMediaConfirm = await this.gotInstance(parsedForm.action, {
                followRedirect: false
            });
            const link = reqMediaConfirm.headers.location;
            if (link) {
                const result = { link, title, isPlayable: true } as ResolvedMediaItem;
                links.push(result);
            }
        }
        return links;
    }

    async fillMetaInfo(resolveMediaItem: ResolvedMediaItem): Promise<void> {
        // const headerswithrange = resolveMediaItem.headers || {};
        // headerswithrange['Range'] = 'bytes=0-0';
        // const rangeresponse = await this.gotInstance(resolveMediaItem.link, {
        //     headers: headerswithrange
        // });
        const gdriveid = this.googleDriveId;
        //google doesn't support HTTP HEAD, so another way to find the size and other meta infor is here.
        const result: { fileSize: string, modifiedDate: Date, mimeType: string } = await this.gotInstance(`https://content.googleapis.com/drive/v2beta/files/${gdriveid}?fields=fileSize%2CmodifiedDate%2CmimeType&supportsTeamDrives=true&key=AIzaSyC1eQ1xj69IdTMeii5r7brs3R90eck-m7k`,
            {
                headers: {
                    "X-Origin": "https://drive.google.com",
                },
            }).json();
        resolveMediaItem.size = result.fileSize;
        resolveMediaItem.lastModified = result.modifiedDate.toString();
        resolveMediaItem.contentType = result.mimeType;
    }
}