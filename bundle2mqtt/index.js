const networkInterfaces = require('node:os').networkInterfaces;

const mqtt = require('mqtt');
const LXIP1 = require('theben-lx-ip1-node').LXIP1;
const Discovery = require('theben-lx-ip1-node').Discovery;

const MQTT_HOST = process.env.MQTT_HOST;
const MQTT_PORT = process.env.MQTT_PORT;
const MQTT_USER = process.env.MQTT_USER;
const MQTT_PASS = process.env.MQTT_PASS;
const MQTT_HA_DISCOVERY_PREFIX = process.env.MQTT_HA_DISCOVERY_PREFIX;

const MQTT_BRIDGE_TOPIC_PREFIX = process.env.MQTT_BRIDGE_TOPIC_PREFIX;
const MQTT_DISCOVERY_SEND_DELAY = process.env.MQTT_DISCOVERY_SEND_DELAY;

const LX1_USER = process.env.LX1_USER;
const LX1_PASS = process.env.LX1_PASS;

const DEVICES = [
  {
    type: 'switch',
    idpart: 'switch_1',
    name: 'Luxor Switch Bathroom',
    set_value: 151,
    get_value: 152,
  },
  {
    type: 'switch',
    idpart: 'switch_2',
    name: 'Luxor Switch Kitchen',
    set_value: 153,
    get_value: 154,
  },
  {
    type: 'switch',
    idpart: 'switch_3',
    name: 'Luxor Switch Living Room',
    set_value: 155,
    get_value: 156,
  },
  {
    type: 'switch',
    idpart: 'switch_4',
    name: 'Luxor Switch Bedroom',
    set_value: 157,
    get_value: 158,
  },
  {
    type: 'switch',
    idpart: 'switch_6',
    name: 'Luxor Switch Fire Hatch',
    set_value: 161,
    get_value: 162,
  },
  {
    type: 'switch',
    idpart: 'switch_8',
    name: 'Luxor Switch Bathroom Mirror',
    set_value: 165,
    get_value: 166,
  },
  {
    type: 'fan',
    idpart: 'fan',
    name: 'DucoBox Silent',
    set_value_med: 159,
    get_value_med: 160,
    set_value_high: 163,
    get_value_high: 164,
  },
  {
    type: 'heating',
    idpart: 'heating',
    name: 'Luxor Heating',
    set_target_temp: 167,
    get_target_temp: 170,
    get_current_temp: 168,
    get_heating_state: 169,
  }
]

const mqttClient = mqtt.connect('mqtt://' + MQTT_HOST + ':' + MQTT_PORT, {
  username: MQTT_USER,
  password: MQTT_PASS,
  clientId: 'bundleluxor2mqtt_' + Math.random().toString(16).substr(2, 8),
  will: {
    topic: MQTT_BRIDGE_TOPIC_PREFIX + '/bridge/state',
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

  publishDeviceDiscovery();
  publishBridgeState();

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

  for (var i = 0; i < DEVICES.length; i++) {
    const device = DEVICES[i];

    if (device.idpart === parts[1]) {
      if (device.type === 'switch') {
        setSwitchState(device, parts[3], message);
      } else if (device.type === 'fan') {
        setFanState(device, parts[3], message);
      } else if (device.type === 'heating') {
        setHeatingState(device, parts[3], message);
      }
    }
  }
}

const publishBridgeState = function() {
  console.log('Publishing bridge state...');
  mqttClient.publish(MQTT_BRIDGE_TOPIC_PREFIX + '/bridge/state', JSON.stringify({
    'state': 'online'
  }));
}

const publishDeviceDiscovery = function() {
  console.log('Publishing device discovery payload...');
  publishBridgeDiscovery();

  for (var i = 0; i < DEVICES.length; i++) {
    const device = DEVICES[i];

    if (device.type === 'switch') {
      publishSwitchDiscovery(device);
    } else if (device.type === 'fan') {
      publishFanDiscovery(device);
    } else if (device.type === 'heating') {
      publishHeatingDiscovery(device);
    } else {
      console.error('Unmatched device type', device.type);
    }
  }
}

const publishBridgeDiscovery = function() {
  const payload = {
    device: {
      identifiers: ['bundleluxor2mqtt_bridge'],
      name: 'BundleLuxor2MQTT Bridge',
      manufacturer: 'BundleLuxor2MQTT',
      model: 'Bridge'
    },
    origin: {
      name: 'BundleLuxor2MQTT'
    },
    components: {
      bundleluxor2mqtt_bridge_connection_state: {
        platform: 'binary_sensor',
        device_class: 'connectivity',
        entity_category: 'diagnostic',
        name: 'Connection state',
        default_entity_id: 'connectivity.bundleluxor2mqtt_bridge_connection_state',
        unique_id: 'bundleluxor2mqtt_bridge_connection_state',

        payload_on: 'online',
        payload_off: 'offline',
        state_topic: MQTT_BRIDGE_TOPIC_PREFIX + '/bridge/state',
        value_template: '{{ value_json.state }}'
      }
    },
    state_topic: MQTT_BRIDGE_TOPIC_PREFIX + '/bridge/state'
  }

  mqttClient.publish(MQTT_HA_DISCOVERY_PREFIX + '/device/bundleluxor2mqtt_bridge/config', JSON.stringify(payload));
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
  console.log('WebSocket disconnected:', s('green', disconnect.description));
});

lxip1.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

lxip1.on('datapoint', (datapoint) => {
  for (var i = 0; i < DEVICES.length; i++) {
    const device = DEVICES[i];
    attachDataPointToSwitch(datapoint, device);
    attachDataPointToFan(datapoint, device);
    attachDataPointToHeating(datapoint, device);
  }

  datapoint.on('valueChanged', () => {
    console.log('Received new value for datapoint', datapoint.id, datapoint.name + ':', datapoint.value);
  });
});

const publishSwitchDiscovery = function(devInfo) {
  const payload = {
    device: {
      identifiers: ['bundleluxor2mqtt_' + devInfo.idpart],
      name: devInfo.name,
      manufacturer: 'Theben',
      model: 'Switch',
      via_device: 'bundleluxor2mqtt_bridge'
    },
    origin: {
      name: 'BundleLuxor2MQTT'
    },
    components: { },
    state_topic: MQTT_BRIDGE_TOPIC_PREFIX + '/' + devInfo.idpart,
  }

  payload.components['bundleluxor2mqtt_' + devInfo.idpart + '_state'] = {
    platform: 'switch',
    device_class: 'switch',
    default_entity_id: 'switch.bundleluxor2mqtt_' + devInfo.idpart + '_state',
    unique_id: 'bundleluxor2mqtt_' + devInfo.idpart + '_state',
    name: null,

    payload_on: 'on',
    payload_off: 'off',
    command_topic: MQTT_BRIDGE_TOPIC_PREFIX + '/' + devInfo.idpart + '/set',
    state_topic: MQTT_BRIDGE_TOPIC_PREFIX + '/' + devInfo.idpart,
    value_template: '{{ value_json.state }}'
  }

  mqttClient.publish(MQTT_HA_DISCOVERY_PREFIX + '/device/bundleluxor2mqtt_' + devInfo.idpart + '/config', JSON.stringify(payload));
}

const publishFanDiscovery = function(devInfo) {
  const payload = {
    device: {
      identifiers: ['bundleluxor2mqtt_' + devInfo.idpart],
      name: devInfo.name,
      manufacturer: 'Theben',
      model: 'Fan',
      via_device: 'bundleluxor2mqtt_bridge'
    },
    origin: {
      name: 'BundleLuxor2MQTT'
    },
    components: { },
    state_topic: MQTT_BRIDGE_TOPIC_PREFIX + '/' + devInfo.idpart,
  }

  payload.components['bundleluxor2mqtt_' + devInfo.idpart + '_state'] = {
    platform: 'fan',
    default_entity_id: 'fan.bundleluxor2mqtt_' + devInfo.idpart + '_state',
    unique_id: 'bundleluxor2mqtt_' + devInfo.idpart + '_state',
    name: null,
    
    speed_range_max: 2,
    percentage_command_topic: MQTT_BRIDGE_TOPIC_PREFIX + '/' + devInfo.idpart + '/set/percentage',
    percentage_state_topic: MQTT_BRIDGE_TOPIC_PREFIX + '/' + devInfo.idpart,
    percentage_value_template: '{{ value_json.state.percentage }}',

    payload_on: 'on',
    payload_off: 'off',
    command_topic: MQTT_BRIDGE_TOPIC_PREFIX + '/' + devInfo.idpart + '/set/on',
    state_topic: MQTT_BRIDGE_TOPIC_PREFIX + '/' + devInfo.idpart,
    state_value_template: '{{ value_json.state.on }}'
  }

  mqttClient.publish(MQTT_HA_DISCOVERY_PREFIX + '/device/bundleluxor2mqtt_' + devInfo.idpart + '/config', JSON.stringify(payload));
}

const publishHeatingDiscovery = function(devInfo) {
  const payload = {
    device: {
      identifiers: ['bundleluxor2mqtt_' + devInfo.idpart],
      name: devInfo.name,
      manufacturer: 'Theben',
      model: 'Heating',
      via_device: 'bundleluxor2mqtt_bridge'
    },
    origin: {
      name: 'BundleLuxor2MQTT'
    },
    components: { },
    state_topic: MQTT_BRIDGE_TOPIC_PREFIX + '/' + devInfo.idpart,
  }

  payload.components['bundleluxor2mqtt_' + devInfo.idpart + '_state'] = {
    platform: 'climate',
    default_entity_id: 'climate.bundleluxor2mqtt_' + devInfo.idpart + '_state',
    unique_id: 'bundleluxor2mqtt_' + devInfo.idpart + '_state',
    name: null,

    modes: ['auto'],
    temperature_unit: 'C',
    temp_step: 0.1,

    current_temperature_topic: MQTT_BRIDGE_TOPIC_PREFIX + '/' + devInfo.idpart + '/state',
    current_temperature_template: '{{ value_json.state.current_temperature }}',

    temperature_command_topic: MQTT_BRIDGE_TOPIC_PREFIX + '/' + devInfo.idpart + '/set',
    temperature_state_topic: MQTT_BRIDGE_TOPIC_PREFIX + '/' + devInfo.idpart + '/state',
    temperature_state_template: '{{ value_json.state.target_temperature }}',

    mode_state_topic: MQTT_BRIDGE_TOPIC_PREFIX + '/' + devInfo.idpart + '/state',
    mode_state_template: '{{ value_json.state.mode }}'
  }

  payload.components['bundleluxor2mqtt_' + devInfo.idpart + '_valve'] = {
    platform: 'sensor',
    default_entity_id: 'sensor.bundleluxor2mqtt_' + devInfo.idpart + '_valve',
    unique_id: 'bundleluxor2mqtt_' + devInfo.idpart + '_valve',
    name: 'valve',

    state_topic: MQTT_BRIDGE_TOPIC_PREFIX + '/' + devInfo.idpart + '/valve',
    value_template: '{{ value_json.state }}'
  }

  mqttClient.publish(MQTT_HA_DISCOVERY_PREFIX + '/device/bundleluxor2mqtt_' + devInfo.idpart + '/config', JSON.stringify(payload));
}

const attachDataPointToSwitch = function(datapoint, device) {
  if (device.set_value === datapoint.id) {
    device.set_value_datapoint = datapoint;
  } else if (device.get_value === datapoint.id) {
    device.get_value_datapoint = datapoint;

    datapoint.on('valueChanged', () => {
      publishSwitchState(device);
    });
  }
}

const attachDataPointToFan = function(datapoint, device) {
  if (device.set_value_med === datapoint.id) {
    device.set_value_med_datapoint = datapoint;
  } else if (device.set_value_high === datapoint.id) {
    device.set_value_high_datapoint = datapoint;
  } else if (device.get_value_med === datapoint.id) {
    device.get_value_med_datapoint = datapoint;

    datapoint.on('valueChanged', () => {
      publishFanState(device);
    });
  } else if (device.get_value_high === datapoint.id) {
    device.get_value_high_datapoint = datapoint;

    datapoint.on('valueChanged', () => {
      publishFanState(device);
    });
  }
}

const attachDataPointToHeating = function(datapoint, device) {
  if (device.set_target_temp === datapoint.id) {
    device.set_target_temp_datapoint = datapoint;
  } else if (device.get_target_temp === datapoint.id) {
    device.get_target_temp_datapoint = datapoint;

    datapoint.on('valueChanged', () => {
      publishHeatingState(device);
    });
  } else if (device.get_current_temp === datapoint.id) {
    device.get_current_temp_datapoint = datapoint;

    datapoint.on('valueChanged', () => {
      publishHeatingState(device);
    });
  } else if (device.get_heating_state === datapoint.id) {
    device.get_heating_state_datapoint = datapoint;

    datapoint.on('valueChanged', () => {
      publishHeatingValve(device);
    });
  }
}

const publishSwitchState = function(device) {
  if (!device.get_value_datapoint) {
    return;
  }

  if (device.get_value_datapoint.value === null) {
    return;
  }

  const state = device.get_value_datapoint.value;

  mqttClient.publish(MQTT_BRIDGE_TOPIC_PREFIX + '/' + device.idpart, JSON.stringify({
    'state': (state ? 'on' : 'off')
  }));
}

const publishFanState = function(device) {
  if (!(device.get_value_med_datapoint && device.get_value_high_datapoint)) {
    return;
  }

  if (device.get_value_med_datapoint.value === null || device.get_value_high_datapoint.value === null) {
    return;
  }

  const state = device.get_value_high_datapoint.value ? 'high' : 
                (device.get_value_med_datapoint.value ? 'medium' : 'off');

  mqttClient.publish(MQTT_BRIDGE_TOPIC_PREFIX + '/' + device.idpart, JSON.stringify({
    'state': {
      'on': state === 'off' ? 'off' : 'on',
      'percentage': state === 'high' ? 2 : (state === 'medium' ? 1 : 0)
    }
  }));
}

const publishHeatingState = function(device) {
  if (!(device.get_target_temp_datapoint && device.get_current_temp_datapoint)) {
    return;
  }

  if (device.get_target_temp_datapoint.value === null || device.get_current_temp_datapoint.value === null) {
    return;
  }

  const target_temperature = device.get_target_temp_datapoint.value;
  const current_temperature = device.get_current_temp_datapoint.value;

  mqttClient.publish(MQTT_BRIDGE_TOPIC_PREFIX + '/' + device.idpart + '/state', JSON.stringify({
    'state': {
      'target_temperature': target_temperature,
      'current_temperature': current_temperature,
      'mode': 'auto'
    }
  }));
}

const publishHeatingValve = function(device) {
  if (!device.get_heating_state_datapoint) {
    return;
  }

  if (device.get_heating_state_datapoint.value === null) {
    return;
  }

  const state = device.get_heating_state_datapoint.value;

  mqttClient.publish(MQTT_BRIDGE_TOPIC_PREFIX + '/' + device.idpart + '/valve', JSON.stringify({
    'state': state
  }));
}

const setSwitchState = function(device, topic, message) {
  if (!device.set_value_datapoint) {
    return;
  }
  
  device.set_value_datapoint.setValue(message === 'on');
}

const setFanState = function(device, topic, message) {
  if (!(device.set_value_med_datapoint && device.set_value_high_datapoint)) {
    return;
  }

  if (topic === 'on') {
    device.set_value_med_datapoint.setValue(message === 'on');
    device.set_value_high_datapoint.setValue(false);
  } else if (topic === 'percentage') {
    if (message === '0') {
      device.set_value_med_datapoint.setValue(false);
      device.set_value_high_datapoint.setValue(false);
    } else if (message === '1') {
      device.set_value_med_datapoint.setValue(true);
      device.set_value_high_datapoint.setValue(false);
    } else if (message === '2') {
      device.set_value_med_datapoint.setValue(false);
      device.set_value_high_datapoint.setValue(true);
    }
  }
}

const setHeatingState = function(device, topic, message) {
  if (!device.set_target_temp_datapoint) {
    return;
  }

  device.set_target_temp_datapoint.setValue(message);
}