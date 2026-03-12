const networkInterfaces = require('node:os').networkInterfaces;

const mqtt = require('mqtt');
const LXIP1 = require('theben-lx-ip1-node').LXIP1;
const Discovery = require('theben-lx-ip1-node').Discovery;

const Bridge = require('./devices/Bridge');
const Switch = require('./devices/Switch');
const Fan = require('./devices/Fan');
const Heating = require('./devices/Heating');
const Blind = require('./devices/Blind');

const MQTT_HOST = process.env.MQTT_HOST;
const MQTT_PORT = process.env.MQTT_PORT;
const MQTT_USER = process.env.MQTT_USER;
const MQTT_PASS = process.env.MQTT_PASS;
const MQTT_HA_DISCOVERY_PREFIX = process.env.MQTT_HA_DISCOVERY_PREFIX;

const MQTT_BRIDGE_TOPIC_PREFIX = process.env.MQTT_BRIDGE_TOPIC_PREFIX;
const MQTT_DISCOVERY_SEND_DELAY = parseInt(process.env.MQTT_DISCOVERY_SEND_DELAY);

const LX1_USER = process.env.LX1_USER;
const LX1_PASS = process.env.LX1_PASS;

const devices = [
  new Bridge({
    id: 'bridge',
    enabled: true,
    name: 'BundleLuxor2MQTT Bridge',
  }),
  new Switch({
    id: 'switch_1',
    enabled: process.env.SWITCH_1_ENABLED === 'true',
    name: process.env.SWITCH_1_NAME,
    set_value_datapoint: parseInt(process.env.SWITCH_1_SET_VALUE_DATAPOINT),
    get_value_datapoint: parseInt(process.env.SWITCH_1_GET_VALUE_DATAPOINT),
  }),
  new Switch({
    id: 'switch_2',
    enabled: process.env.SWITCH_2_ENABLED === 'true',
    name: process.env.SWITCH_2_NAME,
    set_value_datapoint: parseInt(process.env.SWITCH_2_SET_VALUE_DATAPOINT),
    get_value_datapoint: parseInt(process.env.SWITCH_2_GET_VALUE_DATAPOINT),
  }),
  new Switch({
    id: 'switch_3',
    enabled: process.env.SWITCH_3_ENABLED === 'true',
    name: process.env.SWITCH_3_NAME,
    set_value_datapoint: parseInt(process.env.SWITCH_3_SET_VALUE_DATAPOINT),
    get_value_datapoint: parseInt(process.env.SWITCH_3_GET_VALUE_DATAPOINT),
  }),
  new Switch({
    id: 'switch_4',
    enabled: process.env.SWITCH_4_ENABLED === 'true',
    name: process.env.SWITCH_4_NAME,
    set_value_datapoint: parseInt(process.env.SWITCH_4_SET_VALUE_DATAPOINT),
    get_value_datapoint: parseInt(process.env.SWITCH_4_GET_VALUE_DATAPOINT),
  }),
  new Switch({
    id: 'switch_5',
    enabled: process.env.SWITCH_5_ENABLED === 'true',
    name: process.env.SWITCH_5_NAME,
    set_value_datapoint: parseInt(process.env.SWITCH_5_SET_VALUE_DATAPOINT),
    get_value_datapoint: parseInt(process.env.SWITCH_5_GET_VALUE_DATAPOINT),
  }),
  new Switch({
    id: 'switch_6',
    enabled: process.env.SWITCH_6_ENABLED === 'true',
    name: process.env.SWITCH_6_NAME,
    set_value_datapoint: parseInt(process.env.SWITCH_6_SET_VALUE_DATAPOINT),
    get_value_datapoint: parseInt(process.env.SWITCH_6_GET_VALUE_DATAPOINT),
  }),
  new Switch({
    id: 'switch_7',
    enabled: process.env.SWITCH_7_ENABLED === 'true',
    name: process.env.SWITCH_7_NAME,
    set_value_datapoint: parseInt(process.env.SWITCH_7_SET_VALUE_DATAPOINT),
    get_value_datapoint: parseInt(process.env.SWITCH_7_GET_VALUE_DATAPOINT),
  }),
  new Switch({
    id: 'switch_8',
    enabled: process.env.SWITCH_8_ENABLED === 'true',
    name: process.env.SWITCH_8_NAME,
    set_value_datapoint: parseInt(process.env.SWITCH_8_SET_VALUE_DATAPOINT),
    get_value_datapoint: parseInt(process.env.SWITCH_8_GET_VALUE_DATAPOINT),
  }),
  new Switch({
    id: 'switch_9',
    enabled: process.env.SWITCH_9_ENABLED === 'true',
    name: process.env.SWITCH_9_NAME,
    set_value_datapoint: parseInt(process.env.SWITCH_9_SET_VALUE_DATAPOINT),
    get_value_datapoint: parseInt(process.env.SWITCH_9_GET_VALUE_DATAPOINT),
  }),
  new Fan({
    id: 'fan',
    enabled: process.env.FAN_ENABLED === 'true',
    name: process.env.FAN_NAME,
    set_value_med_datapoint: parseInt(process.env.FAN_SET_VALUE_MED_DATAPOINT),
    get_value_med_datapoint: parseInt(process.env.FAN_GET_VALUE_MED_DATAPOINT),
    set_value_high_datapoint: parseInt(process.env.FAN_SET_VALUE_HIGH_DATAPOINT),
    get_value_high_datapoint: parseInt(process.env.FAN_GET_VALUE_HIGH_DATAPOINT),
  }),
  new Heating({
    id: 'heating',
    enabled: process.env.HEATING_ENABLED === 'true',
    name: process.env.HEATING_NAME,
    set_target_temp_datapoint: parseInt(process.env.HEATING_SET_TARGET_TEMP_DATAPOINT),
    get_target_temp_datapoint: parseInt(process.env.HEATING_GET_TARGET_TEMP_DATAPOINT),
    get_current_temp_datapoint: parseInt(process.env.HEATING_GET_CURRENT_TEMP_DATAPOINT),
    get_heating_state_datapoint: parseInt(process.env.HEATING_GET_HEATING_STATE_DATAPOINT),
  }),
  new Blind({
    id: 'blinds',
    enabled: process.env.BLINDS_ENABLED === 'true',
    name: process.env.BLINDS_NAME,
    set_direction_datapoint: parseInt(process.env.BLINDS_SET_DIRECTION_DATAPOINT),
    set_stop_datapoint: parseInt(process.env.BLINDS_SET_STOP_DATAPOINT),
    set_position_datapoint: parseInt(process.env.BLINDS_SET_POSITION_DATAPOINT),
    get_position_datapoint: parseInt(process.env.BLINDS_GET_POSITION_DATAPOINT),
  }),
];

console.log('DEVICES: ', devices);

const mqttClient = mqtt.connect('mqtt://' + MQTT_HOST + ':' + MQTT_PORT, {
  username: MQTT_USER,
  password: MQTT_PASS,
  clientId: 'bundleluxor2mqtt_' + Math.random().toString(16).substr(2, 8),
  will: {
    topic: MQTT_BRIDGE_TOPIC_PREFIX + '/bundleluxor2mqtt_bridge/state',
    payload: JSON.stringify({
      'state': 'offline'
    })
  }
});

mqttClient.on('error', (error) => {
  console.error(error);
});

mqttClient.on('connect', () => {
  console.log('MQTT connected');

  mqttClient.subscribe(MQTT_HA_DISCOVERY_PREFIX + '/status');
  mqttClient.subscribe(MQTT_BRIDGE_TOPIC_PREFIX + '/#');

  devices.forEach(device => {
    device.on('publishMqtt', message => {
      mqttClient.publish(message.topic, message.payload);
    });
  });

  publishDeviceDiscovery();

  console.log('Discovering KNXnet/IP devices on local network...');
  discovery.discover();
});

mqttClient.on('message', (topic, message) => {
  const prefix = topic.split('/')[0];

  if (topic === MQTT_HA_DISCOVERY_PREFIX + '/status') {
    receivedHomeAssistantStatusMessage(message.toString());
  } else if (prefix === MQTT_BRIDGE_TOPIC_PREFIX) {
    receivedBridgeMessage(topic, message.toString());
  } else {
    console.log('Unmatched message', topic, message.toString());
  }
});

const receivedHomeAssistantStatusMessage = function(status) {
  if (status === 'online') {
    console.log('Received homeassistant online status');
    setTimeout(publishDeviceDiscovery, MQTT_DISCOVERY_SEND_DELAY);
  }
}

const receivedBridgeMessage = function(topic, message) {
  console.log(topic, message);

  const parts = topic.split('/');

  if (parts[2] !== 'set') {
    return;
  }

  devices.forEach(device => {
    if (device.getMqttId() === parts[1]) {
      device.onBridgeMessage(topic, message);
    }
  });
}

const publishDeviceDiscovery = function() {
  console.log('Publishing device discovery payload...');

  devices.forEach(device => {
    device.publishMqttDevice();
  });
}

const getLocalAddress = () => {
  const nets = networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.internal) {
        continue;
      }

      const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
      if (net.family !== familyV4Value) {
        continue;
      }

      return net.address;
    }
  }
}

const discovery = new Discovery({
  advertiseAddress: getLocalAddress()
});

discovery.on('error', (error) => {
  console.error(error);
  discovery.stop();
});

discovery.on('device', (device) => {
  console.log('Discovered device:',device.deviceInfo.friendlyName, 'on', device.hpai.ipAddress);
  lxip1.host = device.hpai.ipAddress;

  discovery.stop();

  console.log('Requesting device info from', lxip1.host + '...');
  lxip1.getDeviceInfo();
});

const lxip1 = new LXIP1({
  host: null, // autodiscover
  username: LX1_USER,
  password: LX1_PASS,
});

lxip1.on('deviceInfo', (deviceInfo) => {
  console.log('Device', deviceInfo.name, 'build', deviceInfo.build_version);
  
  console.log('Starting session on', lxip1.host, 'as user', lxip1.username + '...');
  lxip1.login();
});

lxip1.on('sessionExpired', () => {
  console.log('Session expired');
});

lxip1.on('sessionRestarted', () => {
  console.log('Session restarted');
});

lxip1.on('sessionStarted', () => {
  console.log('Session started');

  console.log('Requesting server items...');
  lxip1.getServerItems();
});

lxip1.on('serverItems', (serverItems) => {
  console.log('Received', serverItems.length, 'server items');
  console.log(serverItems);

  console.log('Requesting datapoint descriptions...');
  lxip1.getDatapointDescriptions();
});

lxip1.on('datapoints', (datapoints) => {
  console.log('Received', datapoints.length, 'datapoint descriptions');

  console.log('Requesting datapoint values...');
  lxip1.getDatapointValues();

  console.log('Starting WebSocket connection...');
  lxip1.startWebsocket();
});

lxip1.on('webSocketConnected', () => {
  console.log('WebSocket connected');
});

lxip1.on('webSocketDisconnected', (disconnect) => {
  console.log('WebSocket disconnected:', disconnect.description);
});

lxip1.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

lxip1.on('datapoint', (datapoint) => {
  devices.forEach(device => {
    device.onDatapointFound(datapoint);
  });

  datapoint.on('valueChanged', () => {
    console.log('Received new value for datapoint', datapoint.id, datapoint.name + ':', datapoint.value);
  });
});
