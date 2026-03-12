const Device = require('./Device');

class Bridge extends Device {
  constructor(options) {
    super({
      mqttId: options.id,
      enabled: options.enabled,
      name: options.name,
      model: 'Bridge',
    });

    this.publishedState = false;
  }

  getDiscoveryPayload() {
    const components = this.getComponents();

    const payload = {
      device: {
        identifiers: [this.getMqttId()],
        name: this.name,
        manufacturer: 'BundleLuxor2MQTT',
        model: this.model,
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

  getComponents() {
    const mqttId = this.getMqttId();
    const topicPrefix = process.env.MQTT_BRIDGE_TOPIC_PREFIX;

    const components = { };

    components[`${mqttId}_connection_state`] = {
      platform: 'binary_sensor',
      device_class: 'connectivity',
      entity_category: 'diagnostic',
      name: 'Connection state',

      default_entity_id: `connectivity.${mqttId}_connection_state`,
      unique_id: `${mqttId}_connection_state`,

      payload_on: 'online',
      payload_off: 'offline',

      state_topic: `${topicPrefix}/${mqttId}/state`,
      value_template: '{{ value_json.state }}'
    };

    return components;
  }

  attachDatapoint(datapoint) {
    if (!this.publishedState) {
      this.publishState();
      this.publishedState = true;
    }
  }

  publishState() {
    this.publishMqtt('state', {
      state: 'online'
    });
  }

  receivedBridgeMessage(topic, message) {
    // noop
  }
}

module.exports = Bridge;