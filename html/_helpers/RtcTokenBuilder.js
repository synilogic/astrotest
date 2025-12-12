import pkg from 'agora-token';
const { RtcTokenBuilder , RtcRole } = pkg;
import {Privileges, init, addPrivilege, build} from './accessToken.js';

const RoleAttendee = 0;
const RolePublisher = 1;
const RoleSubscriber = 2;
const RoleAdmin = 101;

function buildTokenWithUid(appID, appCertificate, channelName, uid, role, privilegeExpireTs) {
    return buildTokenWithUserAccount(appID, appCertificate, channelName, uid, role, privilegeExpireTs);
}

function buildTokenWithUserAccount(appID, appCertificate, channelName, userAccount, role, privilegeExpireTs) {
    const token = init(appID, appCertificate, channelName, userAccount);
    if (!token) {
        return null;
    }

    addPrivilege(token, Privileges.kJoinChannel, privilegeExpireTs);
    if (role === RoleAttendee || role === RolePublisher || role === RoleAdmin) {
        addPrivilege(token, Privileges.kPublishVideoStream, privilegeExpireTs);
        addPrivilege(token, Privileges.kPublishAudioStream, privilegeExpireTs);
        addPrivilege(token, Privileges.kPublishDataStream, privilegeExpireTs);
    }
    return build(token);
}

export {
    RoleAttendee,
    RolePublisher,
    RoleSubscriber,
    RoleAdmin,
    buildTokenWithUid,
    buildTokenWithUserAccount,
};