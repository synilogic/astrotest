import crypto from 'crypto';
import pkg from 'crc-32';
const { str } = pkg;

const Privileges = {
    kJoinChannel: 1,
    kPublishAudioStream: 2,
    kPublishVideoStream: 3,
    kPublishDataStream: 4,
    kRtmLogin: 1000,
};

function setUid(token, uid) {
    if (uid === 0) {
        token.uid = "";
    } else {
        token.uid = uid + '';
    }
}

function is_nonempty_string(name, str) {
    if (typeof str === 'string' && str !== "") {
        return true;
    }
    console.log(name + " check failed, should be a non-empty string");
    return false;
}

function init(appID, appCertificate, channelName, uid) {
    if (!is_nonempty_string("appID", appID) ||
        !is_nonempty_string("appCertificate", appCertificate) ||
        !is_nonempty_string("channelName", channelName)) {
        return null;
    }
    const token = {
        appID: appID,
        appCertificate: appCertificate,
        channelName: channelName,
        uid: '',
        message: { privileges: {} }
    };
    setUid(token, uid);
    return token;
}

function addPrivilege(token, key, expireTimestamp) {
    token.message.privileges[key] = expireTimestamp;
}

function packContent(message) {
    const privileges = message.privileges;
    const count = Object.keys(privileges).length;
    const buffer = Buffer.alloc(2 + count * 6);
    buffer.writeUInt16LE(count, 0);
    let offset = 2;
    for (const key in privileges) {
        buffer.writeUInt16LE(parseInt(key), offset);
        offset += 2;
        buffer.writeUInt32LE(privileges[key], offset);
        offset += 4;
    }
    return buffer;
}

function packString(buffer) {
    const lenBuffer = Buffer.alloc(2);
    lenBuffer.writeUInt16LE(buffer.length, 0);
    return Buffer.concat([lenBuffer, buffer]);
}

function build(token) {
    const msg = packContent(token.message);
    const val = Buffer.concat([
        Buffer.from(token.appID),
        Buffer.from(token.channelName),
        Buffer.from(token.uid),
        msg
    ]);
    const sig = crypto.createHmac('sha256', token.appCertificate).update(val).digest();
    const crc_channel_name = str(token.channelName) >>> 0;
    const crc_uid = str(token.uid) >>> 0;
    const content = Buffer.concat([
        packString(sig),
        Buffer.from(new Uint32Array([crc_channel_name]).buffer),
        Buffer.from(new Uint32Array([crc_uid]).buffer),
        Buffer.from(new Uint16Array([msg.length]).buffer),
        msg
    ]);
    const version = "006";
    const ret = version + token.appID + content.toString('base64');
    return ret;
}

export { Privileges, init, addPrivilege, build };