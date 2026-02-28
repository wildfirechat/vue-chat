import axios from "axios";
import Config from "../config";
import wfc from "../wfc/client/wfc";

export class CollectionApi {

    _groupIdPayload(groupId) {
        return groupId ? {groupId} : {};
    }

    createCollection(groupId, title, desc, template, expireType, expireAt, maxParticipants) {
        return this._post('/api/collections', {
            groupId,
            title,
            description: desc,
            template,
            expireType,
            expireAt,
            maxParticipants
        })
    }

    getCollection(collectionId, groupId) {
        return this._post(`/api/collections/${collectionId}/detail`, this._groupIdPayload(groupId))
    }

    joinCollection(collectionId, groupId, content) {
        return this._post(`/api/collections/${collectionId}/join`, {
            ...this._groupIdPayload(groupId),
            content
        })
    }

    deleteCollectionEntry(collectionId, groupId) {
        return this._post(`/api/collections/${collectionId}/delete`, this._groupIdPayload(groupId))
    }

    closeCollection(collectionId, groupId) {
        return this._post(`/api/collections/${collectionId}/close`, this._groupIdPayload(groupId))
    }

    async _post(path, data = {}) {
        let baseUrl = Config.COLLECTION_SERVER;
        // extract host for auth code
        let host = baseUrl.replace(/^https?:\/\//, '').split('/')[0];

        return new Promise((resolve, reject) => {
            wfc.getAuthCode('collection', 2, host, async (authCode) => {
                try {
                    let response = await axios.post(baseUrl + path, data, {
                        headers: {
                            'authCode': authCode,
                        },
                        withCredentials: false,
                    });
                    if (response.data) {
                        if (response.data.code === 0) {
                            resolve(response.data.data); // Android returns data in 'data' field
                        } else {
                            reject(new Error(response.data.message));
                        }
                    } else {
                        reject(new Error('request error, status code: ' + response.status));
                    }
                } catch (e) {
                    reject(e);
                }
            }, (err) => {
                reject(new Error("Failed to get auth code: " + err));
            });
        });
    }
}

const collectionApi = new CollectionApi();
export default collectionApi;
