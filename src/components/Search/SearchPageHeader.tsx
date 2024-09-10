import React, {useMemo} from 'react';
import type {StyleProp, TextStyle} from 'react-native';
import {View} from 'react-native';
import {useOnyx} from 'react-native-onyx';
import Button from '@components/Button';
import ButtonWithDropdownMenu from '@components/ButtonWithDropdownMenu';
import type {DropdownOption} from '@components/ButtonWithDropdownMenu/types';
import Header from '@components/Header';
import type HeaderWithBackButtonProps from '@components/HeaderWithBackButton/types';
import Icon from '@components/Icon';
import * as Expensicons from '@components/Icon/Expensicons';
import * as Illustrations from '@components/Icon/Illustrations';
import {usePersonalDetails} from '@components/OnyxProvider';
import type {ReportActionListItemType, ReportListItemType, TransactionListItemType} from '@components/SelectionList/types';
import Text from '@components/Text';
import useActiveWorkspace from '@hooks/useActiveWorkspace';
import useLocalize from '@hooks/useLocalize';
import useNetwork from '@hooks/useNetwork';
import useResponsiveLayout from '@hooks/useResponsiveLayout';
import useTheme from '@hooks/useTheme';
import useThemeStyles from '@hooks/useThemeStyles';
import * as SearchActions from '@libs/actions/Search';
import Navigation from '@libs/Navigation/Navigation';
import {getAllTaxRates} from '@libs/PolicyUtils';
import * as SearchUtils from '@libs/SearchUtils';
import SearchSelectedNarrow from '@pages/Search/SearchSelectedNarrow';
import variables from '@styles/variables';
import CONST from '@src/CONST';
import type {TranslationPaths} from '@src/languages/types';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type {SearchDataTypes, SearchReport} from '@src/types/onyx/SearchResults';
import type DeepValueOf from '@src/types/utils/DeepValueOf';
import type IconAsset from '@src/types/utils/IconAsset';
import {useSearchContext} from './SearchContext';
import SearchButton from './SearchRouter/SearchButton';
import type {SearchQueryJSON} from './types';

type HeaderWrapperProps = Pick<HeaderWithBackButtonProps, 'title' | 'subtitle' | 'icon' | 'children'> & {
    subtitleStyles?: StyleProp<TextStyle>;
};

function HeaderWrapper({icon, title, subtitle, children, subtitleStyles = {}}: HeaderWrapperProps) {
    const styles = useThemeStyles();

    // If the icon is present, the header bar should be taller and use different font.
    const isCentralPaneSettings = !!icon;

    const middleContent = useMemo(() => {
        return (
            <Header
                title={
                    <Text
                        style={[styles.mutedTextLabel, styles.pre]}
                        numberOfLines={1}
                    >
                        {title}
                    </Text>
                }
                subtitle={
                    <Text
                        numberOfLines={2}
                        style={[styles.textLarge, subtitleStyles]}
                    >
                        {subtitle}
                    </Text>
                }
            />
        );
    }, [styles.mutedTextLabel, styles.pre, styles.textLarge, subtitle, subtitleStyles, title]);

    return (
        <View
            dataSet={{dragArea: false}}
            style={[styles.headerBar, isCentralPaneSettings && styles.headerBarDesktopHeight]}
        >
            <View style={[styles.dFlex, styles.flexRow, styles.alignItemsCenter, styles.flexGrow1, styles.justifyContentBetween, styles.overflowHidden]}>
                {icon && (
                    <Icon
                        src={icon}
                        width={variables.iconHeader}
                        height={variables.iconHeader}
                        additionalStyles={[styles.mr2]}
                    />
                )}

                {middleContent}
                <View style={[styles.reportOptions, styles.flexRow, styles.pr5, styles.alignItemsCenter, styles.gap4]}>{children}</View>
            </View>
        </View>
    );
}

type SearchPageHeaderProps = {
    queryJSON: SearchQueryJSON;
    hash: number;
    onSelectDeleteOption?: (itemsToDelete: string[]) => void;
    setOfflineModalOpen?: () => void;
    setDownloadErrorModalOpen?: () => void;
    data?: TransactionListItemType[] | ReportListItemType[] | ReportActionListItemType[];
};

type SearchHeaderOptionValue = DeepValueOf<typeof CONST.SEARCH.BULK_ACTION_TYPES> | undefined;

type HeaderContent = {
    icon: IconAsset;
    titleText: TranslationPaths;
};

function getHeaderContent(type: SearchDataTypes): HeaderContent {
    switch (type) {
        case CONST.SEARCH.DATA_TYPES.INVOICE:
            return {icon: Illustrations.EnvelopeReceipt, titleText: 'workspace.common.invoices'};
        case CONST.SEARCH.DATA_TYPES.TRIP:
            return {icon: Illustrations.Luggage, titleText: 'travel.trips'};
        case CONST.SEARCH.DATA_TYPES.CHAT:
            return {icon: Illustrations.CommentBubblesBlue, titleText: 'common.chats'};
        case CONST.SEARCH.DATA_TYPES.EXPENSE:
        default:
            return {icon: Illustrations.MoneyReceipts, titleText: 'common.expenses'};
    }
}

function SearchPageHeader({queryJSON, hash, onSelectDeleteOption, setOfflineModalOpen, setDownloadErrorModalOpen, data}: SearchPageHeaderProps) {
    const {translate} = useLocalize();
    const theme = useTheme();
    const styles = useThemeStyles();
    const {isOffline} = useNetwork();
    const {activeWorkspaceID} = useActiveWorkspace();
    const {shouldUseNarrowLayout} = useResponsiveLayout();
    const {selectedTransactions} = useSearchContext();
    const [selectionMode] = useOnyx(ONYXKEYS.MOBILE_SELECTION_MODE);
    const personalDetails = usePersonalDetails();
    const [reports] = useOnyx(ONYXKEYS.COLLECTION.REPORT);
    const taxRates = getAllTaxRates();
    const [cardList = {}] = useOnyx(ONYXKEYS.CARD_LIST);

    const selectedTransactionsKeys = Object.keys(selectedTransactions ?? {});

    const selectedReports: Array<SearchReport['reportID']> = useMemo(
        () =>
            (data ?? [])
                .filter(
                    (item) =>
                        !SearchUtils.isTransactionListItemType(item) &&
                        !SearchUtils.isReportActionListItemType(item) &&
                        item.reportID &&
                        item.transactions.every((transaction: {keyForList: string | number}) => selectedTransactions[transaction.keyForList]?.isSelected),
                )
                .map((item) => item.reportID),
        [data, selectedTransactions],
    );
    const {status, type} = queryJSON;

    const isCannedQuery = SearchUtils.isCannedSearchQuery(queryJSON);

    const headerSubtitle = isCannedQuery ? translate(getHeaderContent(type).titleText) : SearchUtils.getSearchHeaderTitle(queryJSON, personalDetails, cardList, reports, taxRates);
    const headerTitle = isCannedQuery ? '' : translate('search.filtersHeader');
    const headerIcon = isCannedQuery ? getHeaderContent(type).icon : Illustrations.Filters;

    const subtitleStyles = isCannedQuery ? styles.textHeadlineH2 : {};

    const headerButtonsOptions = useMemo(() => {
        if (selectedTransactionsKeys.length === 0) {
            return [];
        }

        const options: Array<DropdownOption<SearchHeaderOptionValue>> = [];

        options.push({
            icon: Expensicons.Download,
            text: translate('common.download'),
            value: CONST.SEARCH.BULK_ACTION_TYPES.EXPORT,
            shouldCloseModalOnSelect: true,
            onSelected: () => {
                if (isOffline) {
                    setOfflineModalOpen?.();
                    return;
                }

                const reportIDList = (selectedReports?.filter((report) => !!report) as string[]) ?? [];
                SearchActions.exportSearchItemsToCSV(
                    {query: status, jsonQuery: JSON.stringify(queryJSON), reportIDList, transactionIDList: selectedTransactionsKeys, policyIDs: [activeWorkspaceID ?? '']},
                    () => {
                        setDownloadErrorModalOpen?.();
                    },
                );
            },
        });

        const shouldShowHoldOption = !isOffline && selectedTransactionsKeys.every((id) => selectedTransactions[id].canHold);

        if (shouldShowHoldOption) {
            options.push({
                icon: Expensicons.Stopwatch,
                text: translate('search.bulkActions.hold'),
                value: CONST.SEARCH.BULK_ACTION_TYPES.HOLD,
                shouldCloseModalOnSelect: true,
                onSelected: () => {
                    if (isOffline) {
                        setOfflineModalOpen?.();
                        return;
                    }

                    Navigation.navigate(ROUTES.TRANSACTION_HOLD_REASON_RHP);
                },
            });
        }

        const shouldShowUnholdOption = !isOffline && selectedTransactionsKeys.every((id) => selectedTransactions[id].canUnhold);

        if (shouldShowUnholdOption) {
            options.push({
                icon: Expensicons.Stopwatch,
                text: translate('search.bulkActions.unhold'),
                value: CONST.SEARCH.BULK_ACTION_TYPES.UNHOLD,
                shouldCloseModalOnSelect: true,
                onSelected: () => {
                    if (isOffline) {
                        setOfflineModalOpen?.();
                        return;
                    }

                    SearchActions.unholdMoneyRequestOnSearch(hash, selectedTransactionsKeys);
                },
            });
        }

        const shouldShowDeleteOption = !isOffline && selectedTransactionsKeys.every((id) => selectedTransactions[id].canDelete);

        if (shouldShowDeleteOption) {
            options.push({
                icon: Expensicons.Trashcan,
                text: translate('search.bulkActions.delete'),
                value: CONST.SEARCH.BULK_ACTION_TYPES.DELETE,
                shouldCloseModalOnSelect: true,
                onSelected: () => {
                    if (isOffline) {
                        setOfflineModalOpen?.();
                        return;
                    }

                    onSelectDeleteOption?.(selectedTransactionsKeys);
                },
            });
        }

        if (options.length === 0) {
            const emptyOptionStyle = {
                interactive: false,
                iconFill: theme.icon,
                iconHeight: variables.iconSizeLarge,
                iconWidth: variables.iconSizeLarge,
                numberOfLinesTitle: 2,
                titleStyle: {...styles.colorMuted, ...styles.fontWeightNormal, ...styles.textWrap},
            };

            options.push({
                icon: Expensicons.Exclamation,
                text: translate('search.bulkActions.noOptionsAvailable'),
                value: undefined,
                ...emptyOptionStyle,
            });
        }

        return options;
    }, [
        queryJSON,
        status,
        selectedTransactionsKeys,
        selectedTransactions,
        translate,
        onSelectDeleteOption,
        hash,
        theme.icon,
        styles.colorMuted,
        styles.fontWeightNormal,
        isOffline,
        setOfflineModalOpen,
        setDownloadErrorModalOpen,
        activeWorkspaceID,
        selectedReports,
        styles.textWrap,
    ]);

    if (shouldUseNarrowLayout) {
        if (selectionMode?.isEnabled) {
            return (
                <SearchSelectedNarrow
                    options={headerButtonsOptions}
                    itemsLength={selectedTransactionsKeys.length}
                />
            );
        }
        return null;
    }

    const onPress = () => {
        const values = SearchUtils.getFiltersFormValues(queryJSON);
        SearchActions.updateAdvancedFilters(values);
        Navigation.navigate(ROUTES.SEARCH_ADVANCED_FILTERS);
    };

    return (
        <HeaderWrapper
            title={headerTitle}
            subtitle={headerSubtitle}
            icon={headerIcon}
            subtitleStyles={subtitleStyles}
        >
            <SearchButton />
            {headerButtonsOptions.length > 0 ? (
                <ButtonWithDropdownMenu
                    onPress={() => null}
                    shouldAlwaysShowDropdownMenu
                    pressOnEnter
                    buttonSize={CONST.DROPDOWN_BUTTON_SIZE.MEDIUM}
                    customText={translate('workspace.common.selected', {selectedNumber: selectedTransactionsKeys.length})}
                    options={headerButtonsOptions}
                    isSplitButton={false}
                    shouldUseStyleUtilityForAnchorPosition
                />
            ) : (
                <Button
                    text={translate('search.filtersHeader')}
                    icon={Expensicons.Filters}
                    onPress={onPress}
                />
            )}
        </HeaderWrapper>
    );
}

SearchPageHeader.displayName = 'SearchPageHeader';

export type {SearchHeaderOptionValue};
export default SearchPageHeader;
