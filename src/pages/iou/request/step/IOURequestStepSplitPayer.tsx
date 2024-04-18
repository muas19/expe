import React, {useMemo} from 'react';
import type {OnyxEntry} from 'react-native-onyx';
import {usePersonalDetails} from '@components/OnyxProvider';
import SelectionList from '@components/SelectionList';
import UserListItem from '@components/SelectionList/UserListItem';
import useLocalize from '@hooks/useLocalize';
import useScreenWrapperTranstionStatus from '@hooks/useScreenWrapperTransitionStatus';
import * as IOUUtils from '@libs/IOUUtils';
import Navigation from '@libs/Navigation/Navigation';
import * as OptionsListUtils from '@libs/OptionsListUtils';
import type {OptionData} from '@libs/ReportUtils';
import * as IOU from '@userActions/IOU';
import type SCREENS from '@src/SCREENS';
import type * as OnyxTypes from '@src/types/onyx';
import type {Participant} from '@src/types/onyx/IOU';
import StepScreenWrapper from './StepScreenWrapper';
import withFullTransactionOrNotFound from './withFullTransactionOrNotFound';
import type {WithWritableReportOrNotFoundProps} from './withWritableReportOrNotFound';
import withWritableReportOrNotFound from './withWritableReportOrNotFound';

type IOURequestStepSplitPayerProps = WithWritableReportOrNotFoundProps<typeof SCREENS.MONEY_REQUEST.STEP_WAYPOINT> & {
    /** Holds data related to Money Request view state, rather than the underlying Money Request data. */
    transaction: OnyxEntry<OnyxTypes.Transaction>;
};

function IOURequestStepSplitPayer({
    route: {
        params: {iouType, transactionID},
    },
    transaction,
}: IOURequestStepSplitPayerProps) {
    const {translate} = useLocalize();
    const personalDetails = usePersonalDetails();
    const {didScreenTransitionEnd} = useScreenWrapperTranstionStatus();
    const sections = useMemo(() => {
        const participantOptions =
            transaction?.participants
                ?.filter((participant) => Boolean(participant.accountID))
                ?.map((participant) => {
                    const participantAccountID = participant.accountID ?? 0;
                    return participantAccountID ? OptionsListUtils.getParticipantsOption(participant, personalDetails) : OptionsListUtils.getReportOption(participant);
                }) ?? [];
        return [
            {
                title: '',
                data: participantOptions.map((participantOption) => ({
                    ...participantOption,
                    isSelected: !!transaction?.splitPayerAccountIDs && transaction?.splitPayerAccountIDs?.includes(participantOption.accountID ?? 0),
                })),
            },
        ];
    }, [transaction?.participants, personalDetails, transaction?.splitPayerAccountIDs]);

    const navigateBack = () => {
        Navigation.goBack();
    };

    const setSplitPayer = (item: Participant | OptionData) => {
        IOU.setSplitPayer(transactionID, item.accountID ?? 0);
        navigateBack();
    };

    return (
        <StepScreenWrapper
            headerTitle={translate('moneyRequestConfirmationList.paidBy')}
            onBackButtonPress={navigateBack}
            shouldShowNotFoundPage={!IOUUtils.isValidMoneyRequestType(iouType)}
            shouldShowWrapper
            testID={IOURequestStepSplitPayer.displayName}
        >
            <SelectionList
                sections={sections}
                ListItem={UserListItem}
                onSelectRow={setSplitPayer}
                showLoadingPlaceholder={!didScreenTransitionEnd}
            />
        </StepScreenWrapper>
    );
}

IOURequestStepSplitPayer.displayName = 'IOURequestStepSplitPayer';

// eslint-disable-next-line rulesdir/no-negated-variables
const IOURequestStepSplitPayerWithWritableReportOrNotFound = withWritableReportOrNotFound(IOURequestStepSplitPayer);
// eslint-disable-next-line rulesdir/no-negated-variables
const IOURequestStepSplitPayerWithFullTransactionOrNotFound = withFullTransactionOrNotFound(IOURequestStepSplitPayerWithWritableReportOrNotFound);

export default IOURequestStepSplitPayerWithFullTransactionOrNotFound;
