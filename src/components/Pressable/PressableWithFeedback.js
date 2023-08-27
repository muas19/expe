import React, {forwardRef, useState} from 'react';
import _ from 'underscore';
import propTypes from 'prop-types';
import GenericPressable from './GenericPressable';
import GenericPressablePropTypes from './GenericPressable/PropTypes';
import OpacityView from '../OpacityView';
import variables from '../../styles/variables';
import useSingleExecution from '../../hooks/useSingleExecution';

const omittedProps = ['wrapperStyle'];

const PressableWithFeedbackPropTypes = {
    ...GenericPressablePropTypes.pressablePropTypes,
    /**
     * Determines what opacity value should be applied to the underlaying view when Pressable is pressed.
     * To disable dimming, pass 1 as pressDimmingValue
     * @default variables.pressDimValue
     */
    pressDimmingValue: propTypes.number,
    /**
     * Determines what opacity value should be applied to the underlaying view when pressable is hovered.
     * To disable dimming, pass 1 as hoverDimmingValue
     * @default variables.hoverDimValue
     */
    hoverDimmingValue: propTypes.number,
    /**
     *  Used to locate this view from native classes.
     */
    id: propTypes.string,
};

const PressableWithFeedbackDefaultProps = {
    ...GenericPressablePropTypes.defaultProps,
    pressDimmingValue: variables.pressDimValue,
    hoverDimmingValue: variables.hoverDimValue,
    id: '',
    wrapperStyle: [],
};

const PressableWithFeedback = forwardRef((props, ref) => {
    const propsWithoutWrapperStyles = _.omit(props, omittedProps);
    const {isExecuting, singleExecution} = useSingleExecution();
    const [isPressed, setIsPressed] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const isDisabled = props.disabled || isExecuting;

    return (
        <OpacityView
            shouldDim={Boolean(!isDisabled && (isPressed || isHovered))}
            dimmingValue={isPressed ? props.pressDimmingValue : props.hoverDimmingValue}
            style={props.wrapperStyle}
        >
            <GenericPressable
                ref={ref}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...propsWithoutWrapperStyles}
                disabled={isDisabled}
                isExecuting={isExecuting}
                onHoverIn={() => {
                    setIsHovered(true);
                    if (props.onHoverIn) props.onHoverIn();
                }}
                onHoverOut={() => {
                    setIsHovered(false);
                    if (props.onHoverOut) props.onHoverOut();
                }}
                onPressIn={() => {
                    setIsPressed(true);
                    if (props.onPressIn) props.onPressIn();
                }}
                onPressOut={() => {
                    setIsPressed(false);
                    if (props.onPressOut) props.onPressOut();
                }}
                onPress={(e) => {
                    singleExecution(() => props.onPress(e))();
                }}
            >
                {(state) => (_.isFunction(props.children) ? props.children(state) : props.children)}
            </GenericPressable>
        </OpacityView>
    );
});

PressableWithFeedback.displayName = 'PressableWithFeedback';
PressableWithFeedback.propTypes = PressableWithFeedbackPropTypes;
PressableWithFeedback.defaultProps = PressableWithFeedbackDefaultProps;

export default PressableWithFeedback;
