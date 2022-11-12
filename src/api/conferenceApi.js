import {AppServerApi} from "./appServerApi";

class ConferenceApi extends AppServerApi {
    constructor() {
        super();
    }

    /**
     *
     * @return {Promise<string>}
     */
    getMyPrivateConferenceId() {
        return this._post('/conference/get_my_id');
    }

    /**
     *
     * @param conferenceInfo
     * @return {Promise<string>}
     */
    createConference(conferenceInfo) {
        return this._post('/conference/create', conferenceInfo);
    }

    /**
     *
     * @param conferenceId
     * @param password
     * @return {Promise<Object>}
     */
    queryConferenceInfo(conferenceId, password) {
        let obj;
        if (password) {
            obj = {conferenceId, password}
        } else {
            obj = {conferenceId}
        }
        return this._post('/conference/info', obj);
    }

    destroyConference(conferenceId) {
        return this._post('/conference/destroy/' + conferenceId);
    }

    favConference(conferenceId) {
        return this._post('/conference/fav/' + conferenceId);
    }

    unfavConference(conferenceId) {
        return this._post('/conference/unfav/' + conferenceId);
    }

    isFavConference(conferenceId) {
        return this._post('/conference/is_fav/' + conferenceId);
    }

    getFavConferences() {
        return this._post('/conference/fav_conferences');
    }

    updateConference(conferenceInfo) {
        return this._post('/conference/put_info', conferenceInfo);
    }

    recordConference(conferenceId, record) {
        return this._post('/conference/recording/' + conferenceId, {recording: record});
    }

    setConferenceFocusUserId(conferenceId, userId) {
        return this._post('/conference/focus/' + conferenceId, {userId: userId ? userId : ''});
    }
}

const conferenceApi = new ConferenceApi();
export default conferenceApi;
