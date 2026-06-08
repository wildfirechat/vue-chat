<template>
    <div class="apply-unmute-container">
        <div class="apply-participant-list-container">
            <ul>
                <li v-for="(participant, i) in applyUnmuteParticipantList" :key="i">
                    <div class="participant-user">
                        <img class="avatar" :src="participant.portrait" alt="">
                        <p class="single-line name"> {{ participant._displayName }}</p>
                        <div class="action-container">
                            <button @click="conferenceManager.approveUnmute(participant.uid,true, true)">同意</button>
                            <button @click="conferenceManager.approveUnmute(participant.uid, true, false)">拒绝</button>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
        <div class="action-all-container">
            <button @click="conferenceManager.approveAllUnmute(true, true)">全部同意</button>
            <button @click="conferenceManager.approveAllUnmute(true, false)">全部拒绝</button>
        </div>
    </div>

</template>

<script>
import conferenceManager from "./conferenceManager";
import store from "../../../store";

export default {
    name: "ConferenceApplyUnmuteAudioListView",
    data() {
        return {
            conferenceManager: conferenceManager,
        }
    },

    computed: {
        applyUnmuteParticipantList() {
            let applyList = this.conferenceManager.applyingUnmuteAudioMembers;
            let users = store.getUserInfos(applyList)
            console.log('applyList', applyList, users);
            return users;
        }
    }
}
</script>

<style scoped>

.apply-unmute-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.apply-participant-list-container {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
}

.apply-participant-list-container ul {
    flex: 1 1 auto;
    height: 0;
    overflow: auto;
}

.participant-user {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 0 4px 8px;
    width: 100%;
}

.participant-user .avatar {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    margin-right: 8px;
}

.participant-user .name {
    flex: 1;
}


.participant-user .action-container button {
    padding: 4px 8px;
    margin-right: 8px;
}

.action-all-container {
    width: 100%;
    display: flex;
    padding: 4px 8px;
    background: var(--background-primary);
    justify-content: center;
}

.action-all-container button {
    margin-right: 8px;
    width: 45%;
    padding: 4px 0;
}

</style>
