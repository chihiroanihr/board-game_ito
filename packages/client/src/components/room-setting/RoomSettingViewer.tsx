import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Stack,
  RadioGroup,
  Radio,
  ToggleButtonGroup,
  FormControlLabel,
  FormLabel,
  FormHelperText,
  useTheme,
} from '@mui/material';
import { Help, Mic, Chat } from '@mui/icons-material';

import { type RoomSetting, roomSettingConfig, CommunicationMethodEnum } from '@bgi/shared';

import { TextFieldWithIcon, TooltipStyled, ToggleButtonWithIcon } from '@/components';

interface RoomSettingViewerProps {
  roomSetting: RoomSetting;
  displayHelperText: boolean;
}

const RoomSettingViewer: React.FC<RoomSettingViewerProps> = ({
  roomSetting,
  displayHelperText = true,
}) => {
  const theme = useTheme();

  // Prepare react-hook-form
  const { control, setValue } = useForm<RoomSetting>({
    defaultValues: roomSetting,
  });

  // If admin changes room setting, the non-admin user can see the changes real-time.
  useEffect(() => {
    setValue('numRound', roomSetting.numRound);
    setValue('answerThemeTime', roomSetting.answerThemeTime);
    setValue('answerNumberTime', roomSetting.answerNumberTime);
    setValue('heartEnabled', roomSetting.heartEnabled);
    setValue('dupNumCard', roomSetting.dupNumCard);
    setValue('communicationMethod', roomSetting.communicationMethod);
  }, [roomSetting, setValue]);

  return (
    <Stack direction="column" spacing={4} pb={!displayHelperText ? 1 : undefined}>
      {/* Field 1 */}
      <Stack direction="column" spacing={1}>
        <Controller
          name="numRound"
          control={control}
          render={({ field }) => (
            <TextFieldWithIcon
              {...field}
              id="numRound_read-only"
              type="number"
              InputProps={{ readOnly: true }}
              label={
                <>
                  Number of Rounds
                  <TooltipStyled title={roomSettingConfig.numRound.helperText} placement="right">
                    <Help fontSize="small" />
                  </TooltipStyled>
                </>
              }
              fullWidth
              size="small"
            />
          )}
        />
      </Stack>

      {/* Field 2 */}
      <Stack direction="column" spacing={1}>
        <Controller
          name="answerThemeTime"
          control={control}
          render={({ field }) => (
            <TextFieldWithIcon
              {...field}
              id="answerThemeTime_read-only"
              type="number"
              InputProps={{ readOnly: true }}
              label={
                <>
                  Answer Theme Time
                  <TooltipStyled
                    title={roomSettingConfig.answerThemeTime.helperText}
                    placement="right"
                  >
                    <Help fontSize="small" />
                  </TooltipStyled>
                </>
              }
              fullWidth
              size="small"
            />
          )}
        />
      </Stack>

      {/* Field 3 */}
      <Stack direction="column" spacing={1}>
        <Controller
          name="answerNumberTime"
          control={control}
          render={({ field }) => (
            <TextFieldWithIcon
              {...field}
              id="answerNumberTime_read-only"
              type="number"
              InputProps={{ readOnly: true }}
              label={
                <>
                  Answer Number Time
                  <TooltipStyled
                    title={roomSettingConfig.answerNumberTime.helperText}
                    placement="right"
                  >
                    <Help fontSize="small" />
                  </TooltipStyled>
                </>
              }
              fullWidth
              size="small"
            />
          )}
        />
      </Stack>

      <Stack direction="column" spacing={2}>
        {/* Radio Buttons 1 */}
        <FormLabel id="heartEnabled_radio-buttons-group_read-only">
          <FormHelperText sx={{ margin: 0 }}>{roomSettingConfig.heartEnabled.label}</FormHelperText>

          <Controller
            name="heartEnabled"
            control={control}
            render={({ field }) => (
              <RadioGroup
                {...field}
                aria-labelledby="heartEnabled_radio-buttons-group_read-only"
                aria-readonly={true}
                defaultValue={roomSetting.heartEnabled} // Currently selected value
                row
              >
                <FormControlLabel
                  value={true}
                  disabled={roomSetting.heartEnabled !== true}
                  label={roomSettingConfig.heartEnabled.radioTrue} // "Enabled"
                  control={<Radio size="small" readOnly={true} />}
                />
                <FormControlLabel
                  value={false}
                  disabled={roomSetting.heartEnabled !== false}
                  label={roomSettingConfig.heartEnabled.radioFalse} // "Disabled"
                  control={<Radio size="small" readOnly={true} />}
                />
              </RadioGroup>
            )}
          />
        </FormLabel>

        {/* Radio Buttons 2 */}
        <FormLabel id="dupNumCard_radio-buttons-group_read-only">
          <FormHelperText sx={{ margin: 0 }}>{roomSettingConfig.dupNumCard.label}</FormHelperText>

          <Controller
            name="dupNumCard"
            control={control}
            render={({ field }) => (
              <RadioGroup
                {...field}
                aria-labelledby="dupNumCard_radio-buttons-group_read-only"
                aria-readonly={true}
                defaultValue={roomSetting.dupNumCard} // Currently selected value
                row
              >
                <FormControlLabel
                  value={true}
                  disabled={roomSetting.dupNumCard !== true}
                  label={roomSettingConfig.dupNumCard.radioTrue} // "Enabled"
                  control={<Radio size="small" />}
                />
                <FormControlLabel
                  value={false}
                  disabled={roomSetting.dupNumCard !== false}
                  label={roomSettingConfig.dupNumCard.radioFalse} // "Disabled"
                  control={<Radio size="small" />}
                />
              </RadioGroup>
            )}
          />
        </FormLabel>

        {/* Toggle Button 1 */}
        <FormLabel id="communicationMethod_toggle-buttons-group_read-only">
          <FormHelperText sx={{ margin: 0 }}>
            {roomSettingConfig.communicationMethod.label}
          </FormHelperText>

          <Controller
            name="communicationMethod"
            control={control}
            render={({ field }) => (
              <ToggleButtonGroup
                {...field}
                aria-labelledby="communicationMethod_toggle-buttons-group_read-only"
                aria-readonly={true}
                value={roomSetting.communicationMethod} // Currently selected value
                fullWidth
                size="small"
                sx={{ marginTop: '9px' }}
              >
                <ToggleButtonWithIcon value={CommunicationMethodEnum.MIC}>
                  <Mic fontSize="small" />
                  {roomSettingConfig.communicationMethod.radioMic}
                </ToggleButtonWithIcon>
                <ToggleButtonWithIcon value={CommunicationMethodEnum.CHAT}>
                  <Chat fontSize="small" />
                  {roomSettingConfig.communicationMethod.radioChat}
                </ToggleButtonWithIcon>
              </ToggleButtonGroup>
            )}
          />
        </FormLabel>
      </Stack>

      {displayHelperText && (
        <FormHelperText
          sx={{
            margin: 0,
            color: 'warning.light',
            mx: 'auto !important',
            mt: `${theme.spacing(3)} !important`,
          }}
        >
          Only admin can change this setting.
        </FormHelperText>
      )}
    </Stack>
  );
};

export default RoomSettingViewer;
