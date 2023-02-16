import axios from "axios";
import Config from "../config";
import {getItem, setItem} from "../ui/util/storageHelper";
import AppServerError from "./appServerError";
import wfc from "../wfc/client/wfc";
import OrganizationServerError from "./organizationServerError";
import UserInfo from "../wfc/model/userInfo";

export class OrganizationServerApi {
    isServiceAvailable = true;
    serviceUnavailbelError = new OrganizationServerError(-1, '未登录或服务不可用');

    constructor() {
        // do nothing
    }

    login() {
        return new Promise((resolve, reject) => {
            //        int ApplicationType_Robot = 0;
//        int ApplicationType_Channel = 1;
//        int ApplicationType_Admin = 2;
            console.log('organizationServer login' )
            if (!Config.ORGANIZATION_SERVER) {
                return Promise.reject(this.serviceUnavailbelError);
            }
            wfc.getAuthCode('admin', 2, '', code => {
                let path = '/api/user_login';
                this._post(path, {
                    authCode: code
                }, true)
                    .then(response => {
                        if (response.data.code === 0) {
                            let appAuthToken = response.headers['authtoken'];
                            if (!appAuthToken) {
                                appAuthToken = response.headers['authToken'];
                            }

                            if (appAuthToken) {
                                setItem('authToken-' + new URL(response.config.url).host, appAuthToken);
                            }
                            this.isServiceAvailable = true;
                            resolve(response.data.result);
                        } else {
                            reject(new OrganizationServerError(response.data.code, response.data.message));
                        }
                    })

            }, error => {
                console.error('getAuthCode error', error);
                reject(new OrganizationServerError(-1, '未登录，或服务不可用'));

            })
        })
    }

    getRootOrganization() {
        return this._post('/api/organization/root');
    }

    getRelationShip(employeeId) {
        return this._post('/api/relationship/employee', {employeeId});
    }

    getOrganizationEx(orgId) {
        return this._post('/api/organization/query_ex', {id: orgId});
    }

    getOrganizations(orgIds) {
        return this._post('/api/organization/query_list', {ids: orgIds});
    }

    getOrganizationEmployees(orgIds) {
        return this._post('/api/organization/batch_employees', {ids: orgIds});
    }

    getOrgEmployees(orgId) {
        return this._post('/api/organization/employees', {ids: orgId});
    }

    getEmployee(employeeId) {
        return this._post('/api/employee/query', {employeeId});
    }

    getEmployeeEx(employeeId) {
        return this._post('/api/employee/query_ex', {employeeId});
    }

    searchEmployee(orgId, keyword) {
        return this._post('/api/employee/search', {organizationId: orgId, keyword: keyword});
    }

    async getOrganizationPath(organizationId) {
        let pathList = [];
        let org = await this._getOrganizationSync(organizationId);
        if (org) {
            pathList.push(org)
            if (org.parentId) {
                pathList.push(...await this.getOrganizationPath(org.parentId));
            }
        }
        return pathList;
    }

    employeeToUserInfo(employee) {
        let userInfo = new UserInfo();
        userInfo.uid = employee.employeeId;
        userInfo.name = employee.name;
        userInfo.displayName = employee.name;
        userInfo.portrait = employee.portrait ? employee.portrait : Config.DEFAULT_PORTRAIT_URL;
        userInfo.gender = employee.gender;
        userInfo.mobile = employee.mobile;
        userInfo.email = employee.email;
        userInfo.updateDt = employee.updateDt;
        //0 normal; 1 robot; 2 thing;
        userInfo.type = 1;
        userInfo.deleted = 0;
        return userInfo;
    }

    async _getOrganizationSync(orgId) {
        let orgs = await this.getOrganizations([orgId])
        return orgs && orgs.length > 0 ? orgs[0] : null;
    }

    /**
     *
     * @param path
     * @param data
     * @param rawResponse
     * @param rawResponseData
     * @return {Promise<string | AxiosResponse<any>|*|T>}
     * @private
     */
    async _post(path, data = null, rawResponse = false, rawResponseData = false) {
        let response;
        path = Config.ORGANIZATION_SERVER + path;
        response = await axios.post(path, data, {
            transformResponse: rawResponseData ? [data => data] : axios.defaults.transformResponse, headers: {
                'authToken': getItem('authToken-' + new URL(path).host),
            }, withCredentials: true,
        })
        if (rawResponse) {
            return response;
        }
        if (response.data) {
            if (rawResponseData) {
                return response.data;
            }
            if (response.data.code === 0) {
                return response.data.result
            } else {
                throw new AppServerError(response.data.code, response.data.message)
            }
        } else {
            throw new Error('request error, status code: ' + response.status)
        }
    }
}

const organizationServerApi = new OrganizationServerApi();
export default organizationServerApi;
