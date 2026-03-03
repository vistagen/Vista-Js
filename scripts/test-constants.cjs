/**
 * Shared test constants — keeps framework naming in one place for tests too.
 * Mirrors packages/vista/src/constants.ts values.
 */

const FRAMEWORK_NAME = 'vista';
const BIN_COMMAND = 'vista';
const TEMP_PREFIX_REGRESSION = `${FRAMEWORK_NAME}-regression-`;
const TEMP_PREFIX_HARDENING = `${FRAMEWORK_NAME}-hardening-`;
const CREATE_APP_PACKAGE = `create-${FRAMEWORK_NAME}-app`;

module.exports = {
  FRAMEWORK_NAME,
  BIN_COMMAND,
  TEMP_PREFIX_REGRESSION,
  TEMP_PREFIX_HARDENING,
  CREATE_APP_PACKAGE,
};
