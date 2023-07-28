import * as Onyx from 'react-native-onyx';
import ONYXKEYS from '../../../ONYXKEYS';

const memoryOnlyKeys = [ONYXKEYS.COLLECTION.REPORT, ONYXKEYS.COLLECTION.POLICY, ONYXKEYS.PERSONAL_DETAILS_LIST];

const enable = () => {
    console.log('Turning on memory only keys');
    Onyx.set(ONYXKEYS.IS_USING_MEMORY_ONLY_KEYS, true);
    Onyx.setMemoryOnlyKeys(memoryOnlyKeys);
};

const disable = () => {
    console.log('Turning off memory only keys');
    Onyx.set(ONYXKEYS.IS_USING_MEMORY_ONLY_KEYS, false);
    Onyx.setMemoryOnlyKeys([]);
};

export {disable, enable};
