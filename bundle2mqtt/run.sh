#!/usr/bin/with-contenv bashio
set +u

export MQTT_HOST=$(bashio::services mqtt "host")
export MQTT_PORT=$(bashio::services mqtt "port")
export MQTT_USER=$(bashio::config 'mqtt_user')
export MQTT_PASS=$(bashio::config 'mqtt_pass')

export MQTT_HA_DISCOVERY_PREFIX=$(bashio::config 'mqtt_ha_discovery_prefix')
export MQTT_BRIDGE_TOPIC_PREFIX=$(bashio::config 'mqtt_bridge_topic_prefix')
export MQTT_DISCOVERY_SEND_DELAY=$(bashio::config 'mqtt_discovery_send_delay')

export LX1_USER=$(bashio::config 'lx1_user')
export LX1_PASS=$(bashio::config 'lx1_pass')

export SWITCH_1_ENABLED=$(bashio::config 'switch_1_enabled')
export SWITCH_1_NAME=$(bashio::config 'switch_1_name')
export SWITCH_1_SET_VALUE_DATAPOINT=$(bashio::config 'switch_1_set_value_datapoint')
export SWITCH_1_GET_VALUE_DATAPOINT=$(bashio::config 'switch_1_get_value_datapoint')

export SWITCH_2_ENABLED=$(bashio::config 'switch_2_enabled')
export SWITCH_2_NAME=$(bashio::config 'switch_2_name')
export SWITCH_2_SET_VALUE_DATAPOINT=$(bashio::config 'switch_2_set_value_datapoint')
export SWITCH_2_GET_VALUE_DATAPOINT=$(bashio::config 'switch_2_get_value_datapoint')

export SWITCH_3_ENABLED=$(bashio::config 'switch_3_enabled')
export SWITCH_3_NAME=$(bashio::config 'switch_3_name')
export SWITCH_3_SET_VALUE_DATAPOINT=$(bashio::config 'switch_3_set_value_datapoint')
export SWITCH_3_GET_VALUE_DATAPOINT=$(bashio::config 'switch_3_get_value_datapoint')

export SWITCH_4_ENABLED=$(bashio::config 'switch_4_enabled')
export SWITCH_4_NAME=$(bashio::config 'switch_4_name')
export SWITCH_4_SET_VALUE_DATAPOINT=$(bashio::config 'switch_4_set_value_datapoint')
export SWITCH_4_GET_VALUE_DATAPOINT=$(bashio::config 'switch_4_get_value_datapoint')

export SWITCH_5_ENABLED=$(bashio::config 'switch_5_enabled')
export SWITCH_5_NAME=$(bashio::config 'switch_5_name')
export SWITCH_5_SET_VALUE_DATAPOINT=$(bashio::config 'switch_5_set_value_datapoint')
export SWITCH_5_GET_VALUE_DATAPOINT=$(bashio::config 'switch_5_get_value_datapoint')

export SWITCH_6_ENABLED=$(bashio::config 'switch_6_enabled')
export SWITCH_6_NAME=$(bashio::config 'switch_6_name')
export SWITCH_6_SET_VALUE_DATAPOINT=$(bashio::config 'switch_6_set_value_datapoint')
export SWITCH_6_GET_VALUE_DATAPOINT=$(bashio::config 'switch_6_get_value_datapoint')

export SWITCH_7_ENABLED=$(bashio::config 'switch_7_enabled')
export SWITCH_7_NAME=$(bashio::config 'switch_7_name')
export SWITCH_7_SET_VALUE_DATAPOINT=$(bashio::config 'switch_7_set_value_datapoint')
export SWITCH_7_GET_VALUE_DATAPOINT=$(bashio::config 'switch_7_get_value_datapoint')

export SWITCH_8_ENABLED=$(bashio::config 'switch_8_enabled')
export SWITCH_8_NAME=$(bashio::config 'switch_8_name')
export SWITCH_8_SET_VALUE_DATAPOINT=$(bashio::config 'switch_8_set_value_datapoint')
export SWITCH_8_GET_VALUE_DATAPOINT=$(bashio::config 'switch_8_get_value_datapoint')

export SWITCH_9_ENABLED=$(bashio::config 'switch_9_enabled')
export SWITCH_9_NAME=$(bashio::config 'switch_9_name')
export SWITCH_9_SET_VALUE_DATAPOINT=$(bashio::config 'switch_9_set_value_datapoint')
export SWITCH_9_GET_VALUE_DATAPOINT=$(bashio::config 'switch_9_get_value_datapoint')

export FAN_ENABLED=$(bashio::config 'fan_enabled')
export FAN_NAME=$(bashio::config 'fan_name')
export FAN_SET_VALUE_MED_DATAPOINT=$(bashio::config 'fan_set_value_med_datapoint')
export FAN_GET_VALUE_MED_DATAPOINT=$(bashio::config 'fan_get_value_med_datapoint')
export FAN_SET_VALUE_HIGH_DATAPOINT=$(bashio::config 'fan_set_value_high_datapoint')
export FAN_GET_VALUE_HIGH_DATAPOINT=$(bashio::config 'fan_get_value_high_datapoint')

export HEATING_ENABLED=$(bashio::config 'heating_enabled')
export HEATING_NAME=$(bashio::config 'heating_name')
export HEATING_SET_TARGET_TEMP_DATAPOINT=$(bashio::config 'heating_set_target_temp_datapoint')
export HEATING_GET_TARGET_TEMP_DATAPOINT=$(bashio::config 'heating_get_target_temp_datapoint')
export HEATING_GET_CURRENT_TEMP_DATAPOINT=$(bashio::config 'heating_get_current_temp_datapoint')
export HEATING_GET_HEATING_STATE_DATAPOINT=$(bashio::config 'heating_get_heating_state_datapoint')

bashio::log.info "Starting bundle2mqtt service."
npm run start