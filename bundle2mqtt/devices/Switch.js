const Device = require('./Device');

class Switch extends Device {
  constructor(options) {
    super({
      mqttId: options.id,
      enabled: options.enabled,
      name: options.name,
      model: 'Switch',
    });

    this.get_value_datapoint_id = options.get_value_datapoint;
    this.set_value_datapoint_id = options.set_value_datapoint;
  }

  getComponents() {
    const mqttId = this.getMqttId();
    const topicPrefix = process.env.MQTT_BRIDGE_TOPIC_PREFIX;

    const components = { };

    components[`${mqttId}_state`] = {
      platform: 'switch',
      default_entity_id: `switch.${mqttId}_state`,
      unique_id: `${mqttId}_state`,
      name: null,

      payload_on: 'on',
      payload_off: 'off',
      command_topic: `${topicPrefix}/${mqttId}/set`,
      state_topic: `${topicPrefix}/${mqttId}/state`,
      value_template: '{{ value_json.state }}',
    };

    return components;
  }

  attachDatapoint(datapoint) {
    if (this.set_value_datapoint_id === datapoint.id) {
      this.set_value_datapoint = datapoint;
    } else if (this.get_value_datapoint_id === datapoint.id) {
      this.get_value_datapoint = datapoint;

      datapoint.on('valueChanged', () => {
        this.publishState();
      });
    }
  }

  publishState() {
    if (!this.get_value_datapoint) {
      return;
    }

    if (this.get_value_datapoint.value === null) {
      return;
    }

    const state = this.get_value_datapoint.value;

    this.publishMqtt('state', {
      state: (state ? 'on' : 'off')
    });
  }

  receivedBridgeMessage(topic, message) {
    if (!this.set_value_datapoint) {
      return;
    }

    this.set_value_datapoint.setValue(message === 'on');
  }
}

module.exports = Switch;