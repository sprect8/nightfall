/**
 * this file over default confidurtation of Nightlite
 * for test environment.
 */
import { overrideDefaultConfig } from '@eyblockchain/nightlite';
import config from 'config';

overrideDefaultConfig({
  NODE_HASHLENGTH: config.NODE_HASHLENGTH,
});

jest.setTimeout(7200000);
