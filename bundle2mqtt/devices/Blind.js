const Device = require('./Device');

class Blind extends Device {
  constructor(options) {
    super({
      mqttId: options.id,
      enabled: options.enabled,
      name: options.name,
      model: 'Blind',
    });

    this.set_direction_datapoint_id = options.set_direction_datapoint;
    this.set_stop_datapoint_id = options.set_stop_datapoint;
    this.set_position_datapoint_id = options.set_position_datapoint;
    this.get_position_datapoint_id = options.get_position_datapoint;
  }

  getComponents() {
    const mqttId = this.getMqttId();
    const topicPrefix = process.env.MQTT_BRIDGE_TOPIC_PREFIX;

    const components = { };

    components[`${mqttId}_state`] = {
      platform: 'cover',
      default_entity_id: `cover.${mqttId}_state`,
      unique_id: `${mqttId}_state`,
      name: null,

      payload_open: 'open',
      payload_close: 'close',
      payload_stop: 'stop',

      command_topic: `${topicPrefix}/${mqttId}/set`,
      state_topic: `${topicPrefix}/${mqttId}/state`,
      value_template: '{{ value_json.state.state }}',

      position_closed: 255,
      position_open: 0,
      position_topic: `${topicPrefix}/${mqttId}/state`,
      position_template: '{{ value_json.state.position }}',
      set_position_topic: `${topicPrefix}/${mqttId}/set/position`,
    };

    return components;
  }

  attachDatapoint(datapoint) {
    if (this.set_direction_datapoint_id === datapoint.id) {
      this.set_direction_datapoint = datapoint;
    } else if (this.set_stop_datapoint_id === datapoint.id) {
      this.set_stop_datapoint = datapoint;
    } else if (this.set_position_datapoint_id === datapoint.id) {
      this.set_position_datapoint = datapoint;
    } else if (this.get_position_datapoint_id === datapoint.id) {
      this.get_position_datapoint = datapoint;

      datapoint.on('valueChanged', () => {
        this.publishState();
      });
    }
  }

  publishState() {
    if (!this.get_position_datapoint) {
      return;
    }

    if (this.get_position_datapoint.value === null) {
      return;
    }

    const position = this.get_position_datapoint.value;


    this.publishMqtt('state', {
      'state': {
        'state': position === 0 ? 'open' : position === 255 ? 'closed' : 'stopped',
        'position': position,
      }
    });
  }

  receivedBridgeMessage(topic, message) {
    if (!(this.set_stop_datapoint && this.set_position_datapoint && this.set_stop_datapoint)) {
      return;
    }

    if (topic === 'position') {
      this.set_position_datapoint.setValue(message);
    } else {
      if (message === 'open') {
        this.set_direction_datapoint.setValue(true);
      } else if (message === 'close') {
        this.set_direction_datapoint.setValue(false);
      } else if (message === 'stop') {
        this.set_stop_datapoint.setValue(true);
      }
    }
  }
}

module.exports = Blind;