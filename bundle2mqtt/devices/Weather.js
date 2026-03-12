const Device = require('./Device');

class Weather extends Device {
  constructor(options) {
    super({
      mqttId: options.id,
      enabled: options.enabled,
      name: options.name,
      model: 'Weather',
    });

    this.sensors = options.sensors;
  }

  getComponents() {
    const mqttId = this.getMqttId();
    const topicPrefix = process.env.MQTT_BRIDGE_TOPIC_PREFIX;

    const components = { };

    this.sensors.forEach(sensor => {
      const componentId = `${mqttId}_${sensor.id}`;

      if (sensor.enabled && sensor.unit === 'bool') {
        components[`${componentId}_state`] = {
          platform: 'binary_sensor',
          default_entity_id: `binary_sensor.${componentId}_state`,
          unique_id: `${componentId}_state`,
          name: sensor.name,

          payload_on: 'on',
          payload_off: 'off',
          state_topic: `${topicPrefix}/${mqttId}/${sensor.id}_state`,
          value_template: '{{ value_json.state }}'
        };
      } else if (sensor.enabled && sensor.unit !== 'bool') {
        components[`${componentId}_state`] = {
          platform: 'sensor',
          default_entity_id: `sensor.${componentId}_state`,
          unique_id: `${componentId}_state`,
          name: sensor.name,

          device_class: sensor.device_class,
          unit_of_measurement: sensor.unit,

          state_topic: `${topicPrefix}/${mqttId}/${sensor.id}_state`,
          value_template: '{{ value_json.state }}'
        };
      } else if (!sensor.enabled) {
        components[`${componentId}_state`] = {
          platform: sensor.unit === 'bool' ? 'binary_sensor' : 'sensor',
        };
      }
    });

    return components;
  }

  attachDatapoint(datapoint) {
    this.sensors.forEach(sensor => {
      if (sensor.enabled && sensor.datapoint_id === datapoint.id) {
        sensor.datapoint = datapoint;

        datapoint.on('valueChanged', () => {
          this.publishState(sensor, datapoint);
        });
      }
    });
  }

  publishState(sensor, datapoint) {
    if (!sensor.datapoint) {
      return;
    }

    if (sensor.datapoint.value === null) {
      return;
    }

    const state = sensor.unit === 'bool' ?
      (sensor.datapoint.value ? 'on' : 'off') : sensor.datapoint.value;

    this.publishMqtt(`${sensor.id}_state`, {
      state: state
    });
  }

  receivedBridgeMessage(topic, message) {
    // noop
  }
}

module.exports = Weather;