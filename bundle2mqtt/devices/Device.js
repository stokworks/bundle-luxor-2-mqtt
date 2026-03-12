const EventEmitter = require('node:events');

class Device extends EventEmitter {
  constructor(options) {
    super();

    if (new.target === Device) {
      throw new Error("Device is abstract");
    }

    this.mqttId = 'bundleluxor2mqtt_' + options.mqttId;
    this.enabled = options.enabled;
    this.name = options.name;
    this.model = options.model;
  }

  getDiscoveryPayload() {
    const components = this.getComponents();

    const payload = {
      device: {
        identifiers: [this.getMqttId()],
        name: this.name,
        manufacturer: 'Theben',
        model: this.model,
        via_device: 'bundleluxor2mqtt_bridge',
      },
      origin: {
        name: 'BundleLuxor2MQTT'
      },
      components: { },
    };

    for (const [componentId, componentPayload] of Object.entries(components)) {
      payload.components[componentId] = this.enabled ? componentPayload : this.disableComponentPayload(componentPayload);
    }

    return payload;
  }

  onDatapointFound(datapoint) {
    if (!this.enabled) {
      return;
    }

    this.attachDatapoint(datapoint);
  }

  onBridgeMessage(topic, message) {
    if (!this.enabled) {
      return;
    }

    this.receivedBridgeMessage(topic, message);
  }

  publishMqttDevice() {
    const mqttId = this.getMqttId();
    const discoveryPrefix = process.env.MQTT_HA_DISCOVERY_PREFIX;
    const payload = this.getDiscoveryPayload();

    this.emit('publishMqtt', {
      topic: `${discoveryPrefix}/device/${mqttId}/config`,
      payload: JSON.stringify(payload),
    });
  }

  publishMqtt(topic, payload) {
    const mqttId = this.getMqttId();
    const topicPrefix = process.env.MQTT_BRIDGE_TOPIC_PREFIX;

    this.emit('publishMqtt', {
      topic: `${topicPrefix}/${mqttId}/${topic}`,
      payload: JSON.stringify(payload),
    });
  }

  getMqttId() {
    return this.mqttId;
  }

  disableComponentPayload(componentPayload) {
    return { platform: componentPayload.platform };
  }

  getComponents() {
    throw new Error('Not implemented');
  }

  attachDatapoint(datapoint) {
    throw new Error('Not implemented');
  }

  receivedBridgeMessage(topic, message) {
    throw new Error('Not implemented');
  }
}

module.exports = Device;