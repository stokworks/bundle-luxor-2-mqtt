const Device = require('./Device');

class Heating extends Device {
  constructor(options) {
    super({
      mqttId: options.id,
      enabled: options.enabled,
      name: options.name,
      model: 'Heating',
    });

    this.set_target_temp_datapoint_id = options.set_target_temp_datapoint;
    this.get_target_temp_datapoint_id = options.get_target_temp_datapoint;
    this.get_current_temp_datapoint_id = options.get_current_temp_datapoint;
    this.get_heating_state_datapoint_id = options.get_heating_state_datapoint;
  }

  getComponents() {
    const mqttId = this.getMqttId();
    const topicPrefix = process.env.MQTT_BRIDGE_TOPIC_PREFIX;

    const components = { };

    components[`${mqttId}_state`] = {
      platform: 'climate',
      default_entity_id: `climate.${mqttId}_state`,
      unique_id: `${mqttId}_state`,
      name: null,

      modes: ['heat'],
      temperature_unit: 'C',
      temp_step: 0.1,

      current_temperature_topic: `${topicPrefix}/${mqttId}/state`,
      current_temperature_template: '{{ value_json.state.current_temperature }}',

      temperature_command_topic: `${topicPrefix}/${mqttId}/set`,
      temperature_state_topic: `${topicPrefix}/${mqttId}/state`,
      temperature_state_template: '{{ value_json.state.target_temperature }}',

      mode_state_topic: `${topicPrefix}/${mqttId}/state`,
      mode_state_template: '{{ value_json.state.mode }}',

      action_topic: `${topicPrefix}/${mqttId}/state`,
      action_template: '{{ value_json.state.action }}',
    };

    components[`${mqttId}_valve`] = {
      platform: 'sensor',
      default_entity_id: `climate.${mqttId}_valve`,
      unique_id: `${mqttId}_valve`,
      name: 'valve',

      state_topic: `${topicPrefix}/${mqttId}/valve`,
      value_template: '{{ value_json.state }}',
    };

    return components;
  }

  attachDatapoint(datapoint) {
    if (this.set_target_temp_datapoint_id  === datapoint.id) {
      this.set_target_temp_datapoint = datapoint;
    } else if (this.get_target_temp_datapoint_id  === datapoint.id) {
      this.get_target_temp_datapoint = datapoint;

      datapoint.on('valueChanged', () => {
        this.publishState();
      });
    } else if (this.get_current_temp_datapoint_id  === datapoint.id) {
      this.get_current_temp_datapoint = datapoint;

      datapoint.on('valueChanged', () => {
        this.publishState();
      });
    } else if (this.get_heating_state_datapoint_id === datapoint.id) {
      this.get_heating_state_datapoint = datapoint;

      datapoint.on('valueChanged', () => {
        this.publishState();
        this.publishValve();
      });
    }
  }

  publishState() {
    if (!(this.get_target_temp_datapoint && this.get_current_temp_datapoint && this.get_heating_state_datapoint)) {
      return;
    }

    if (this.get_target_temp_datapoint.value === null || this.get_current_temp_datapoint.value === null || this.get_heating_state_datapoint.value === null) {
      return;
    }

    const target_temperature = this.get_target_temp_datapoint.value;
    const current_temperature = this.get_current_temp_datapoint.value;
    const action = this.get_heating_state_datapoint.value > 0 ? 'heating' : 'idle';

    this.publishMqtt('state', {
      'target_temperature': target_temperature,
      'current_temperature': current_temperature,
      'mode': 'heat',
      'action': action,
    });
  }

  publishValve() {
    if (!this.get_heating_state_datapoint) {
      return;
    }

    if (this.get_heating_state_datapoint.value === null) {
      return;
    }

    const state = this.get_heating_state_datapoint.value;

    this.publishMqtt('valve', {
      'state': state
    });
  }

  receivedBridgeMessage(topic, message) {
    if (!this.set_target_temp_datapoint) {
      return;
    }

    this.set_target_temp_datapoint.setValue(message);
  }
}

module.exports = Heating;