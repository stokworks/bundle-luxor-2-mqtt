const Device = require('./Device');

class Fan extends Device {
  constructor(options) {
    super({
      mqttId: options.id,
      enabled: options.enabled,
      name: options.name,
      model: 'Fan',
    });

    this.get_value_med_datapoint_id = options.get_value_med_datapoint;
    this.set_value_med_datapoint_id = options.set_value_med_datapoint;
    this.get_value_high_datapoint_id = options.get_value_high_datapoint;
    this.set_value_high_datapoint_id = options.set_value_high_datapoint;

    this.skipNextPublish = false;
  }

  getComponents() {
    const mqttId = this.getMqttId();
    const topicPrefix = process.env.MQTT_BRIDGE_TOPIC_PREFIX;

    const components = { };

    components[`${mqttId}_state`] = {
      platform: 'fan',
      default_entity_id: `fan.${mqttId}_state`,
      unique_id: `${mqttId}_state`,
      name: null,

      speed_range_max: 2,
      percentage_command_topic: `${topicPrefix}/${mqttId}/set/percentage`,
      percentage_state_topic: `${topicPrefix}/${mqttId}/state`,
      percentage_value_template: '{{ value_json.state.percentage }}',

      payload_on: 'on',
      payload_off: 'off',
      command_topic: `${topicPrefix}/${mqttId}/set/on`,
      state_topic: `${topicPrefix}/${mqttId}/state`,
      state_value_template: '{{ value_json.state.on }}'
    };

    return components;
  }

  attachDatapoint(datapoint) {
    if (this.set_value_med_datapoint_id === datapoint.id) {
      this.set_value_med_datapoint = datapoint;
    } else if (this.set_value_high_datapoint_id === datapoint.id) {
      this.set_value_high_datapoint = datapoint;
    } else if (this.get_value_med_datapoint_id === datapoint.id) {
      this.get_value_med_datapoint = datapoint;

      datapoint.on('valueChanged', () => {
        this.publishState();
      });
    } else if (this.get_value_high_datapoint_id === datapoint.id) {
      this.get_value_high_datapoint = datapoint;

      datapoint.on('valueChanged', () => {
        this.publishState();
      });
    }
  }

  publishState() {
    if (!(this.get_value_med_datapoint && this.get_value_high_datapoint)) {
      return;
    }

    if (this.get_value_med_datapoint.value === null || this.get_value_high_datapoint.value === null) {
      return;
    }

    const state = this.get_value_high_datapoint.value ? 'high' :
      (this.get_value_med_datapoint.value ? 'medium' : 'off');

    if (state === 'off' && this.skipNextPublish) {
      this.skipNextPublish = false;
      console.log('Skipped publishing fan off state because we just switched fan modes');
      return;
    }

    this.publishMqtt('state', {
      state: {
        'on': state === 'off' ? 'off' : 'on',
        'percentage': state === 'high' ? 2 : (state === 'medium' ? 1 : 0)
      },
    });
  }

  receivedBridgeMessage(topic, message) {
    console.log('fan1', topic, message);

    if (!(this.set_value_med_datapoint && this.set_value_high_datapoint)) {
      return;
    }

    console.log('fan2', topic, message);

    if (topic === 'on') {
      console.log('fan3', topic, message);
      this.set_value_med_datapoint.setValue(message === 'on');
      this.set_value_high_datapoint.setValue(false);
    } else if (topic === 'percentage') {
      console.log('fan4', topic, message);
      if (message === '0') {
        this.set_value_med_datapoint.setValue(false);
        this.set_value_high_datapoint.setValue(false);
      } else if (message === '1') {
        this.skipNextPublish = true;
        setTimeout(() => this.skipNextPublish = false, 250);
        this.set_value_med_datapoint.setValue(true);
        this.set_value_high_datapoint.setValue(false);
      } else if (message === '2') {
        this.skipNextPublish = true;
        setTimeout(() => this.skipNextPublish = false, 250);
        this.set_value_med_datapoint.setValue(false);
        this.set_value_high_datapoint.setValue(true);
      }
    }
  }
}

module.exports = Fan;