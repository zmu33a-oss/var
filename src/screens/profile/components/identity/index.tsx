import { Image, Text, View } from "react-native";
import {
  getArabicFontStyle,
  resolveProfileAvatarUri,
} from "../../profile.helpers";
import { styles } from "../../profile.styles";
import { KSA_EMBLEM } from "../../profile.constants";

export { VarIdentityCard } from "./VarIdentityCard";

export function IdentityPortrait(props: { uri?: string; compact?: boolean }) {
  return (
    <View
      style={[
        styles.portraitFrame,
        props.compact ? styles.portraitFrameCompact : null,
      ]}
    >
      <Image
        source={{ uri: resolveProfileAvatarUri(props.uri) }}
        style={styles.portraitImage}
      />
    </View>
  );
}

export function SaudiEmblem() {
  return (
    <View style={styles.idTopBandSeal}>
      <Image
        source={KSA_EMBLEM}
        resizeMode="contain"
        style={styles.idTopBandSealImage}
      />
    </View>
  );
}

export function IdentityEnglishInfoRow(props: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.idEnglishInfoRow}>
      <Text style={styles.idEnglishInfoLabel}>{props.label}:</Text>
      <Text numberOfLines={1} style={styles.idEnglishInfoValue}>
        {props.value}
      </Text>
    </View>
  );
}

export function IdentityArabicInfoRow(props: {
  label: string;
  value: string;
  arabicFontFamily?: string;
}) {
  const labelArabicStyle = getArabicFontStyle(props.arabicFontFamily);
  const valueArabicStyle = getArabicFontStyle(
    props.arabicFontFamily,
    props.value,
  );

  return (
    <View style={styles.identityArabicInfoRow}>
      <Text style={[styles.identityArabicInfoLabel, labelArabicStyle]}>
        {props.label}
      </Text>
      <Text style={[styles.identityArabicInfoValue, valueArabicStyle]}>
        {props.value}
      </Text>
    </View>
  );
}

export function IdentityPairedInfoRow(props: {
  englishLabel: string;
  englishValue: string;
  arabicLabel: string;
  arabicValue: string;
  englishValueTight?: boolean;
  emphasizeValue?: boolean;
  compactEnglishLabel?: boolean;
  isIdRow?: boolean;
  narrow?: boolean;
}) {
  return (
    <View
      style={[
        styles.idPairedInfoRow,
        props.narrow ? styles.idPairedInfoRowNarrow : null,
      ]}
    >
      <View
        style={[
          styles.idPairedInfoEnglishBlock,
          props.narrow ? styles.idPairedInfoEnglishBlockNarrow : null,
        ]}
      >
        <Text
          style={[
            styles.idPairedInfoEnglishLabel,
            props.compactEnglishLabel
              ? styles.idPairedInfoEnglishLabelCompact
              : null,
            props.isIdRow ? styles.idPairedInfoEnglishLabelIdRow : null,
          ]}
        >
          {props.englishLabel} :
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.idPairedInfoEnglishValue,
            props.emphasizeValue
              ? styles.idPairedInfoEnglishValueEmphasis
              : null,
            props.englishValueTight
              ? styles.idPairedInfoEnglishValueTight
              : null,
            props.narrow ? styles.idPairedInfoEnglishValueNarrow : null,
            props.isIdRow ? styles.idPairedInfoEnglishValueIdRow : null,
          ]}
        >
          {props.englishValue}
        </Text>
      </View>

      <View
        style={[
          styles.idPairedInfoArabicBlock,
          props.narrow ? styles.idPairedInfoArabicBlockNarrow : null,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.idPairedInfoArabicLabel,
            props.isIdRow ? styles.idPairedInfoArabicLabelIdRow : null,
          ]}
        >
          {props.arabicLabel} :
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.idPairedInfoArabicValue,
            props.emphasizeValue
              ? styles.idPairedInfoArabicValueEmphasis
              : null,
            props.narrow ? styles.idPairedInfoArabicValueNarrow : null,
            props.isIdRow ? styles.idPairedInfoArabicValueIdRow : null,
          ]}
        >
          {props.arabicValue}
        </Text>
      </View>
    </View>
  );
}

export function IdentityBilingualInfoRow(props: {
  arabicLabel: string;
  englishLabel: string;
  arabicValue: string;
  englishValue: string;
  arabicFontFamily?: string;
  compact?: boolean;
}) {
  const labelArabicStyle = getArabicFontStyle(
    props.arabicFontFamily,
    props.arabicLabel,
  );
  const valueArabicStyle = getArabicFontStyle(
    props.arabicFontFamily,
    props.arabicValue,
  );

  return (
    <View
      style={[
        styles.identityBilingualInfoRow,
        props.compact ? styles.identityBilingualInfoRowCompact : null,
      ]}
    >
      <View style={styles.identityBilingualInfoHeader}>
        <Text
          style={[styles.identityBilingualInfoLabelArabic, labelArabicStyle]}
        >
          {props.arabicLabel}
        </Text>
        <Text style={styles.identityBilingualInfoLabelEnglish}>
          {props.englishLabel}
        </Text>
      </View>
      <View style={styles.identityBilingualInfoValues}>
        <Text
          numberOfLines={1}
          style={[styles.identityBilingualInfoValueArabic, valueArabicStyle]}
        >
          {props.arabicValue}
        </Text>
        <Text
          numberOfLines={1}
          style={styles.identityBilingualInfoValueEnglish}
        >
          {props.englishValue}
        </Text>
      </View>
    </View>
  );
}

export function IdentityBarcode(props: { value: string }) {
  const bars = props.value
    .replace(/\D/g, "")
    .slice(0, 10)
    .split("")
    .flatMap((digit, index) => {
      const width = (Number(digit) % 3) + 1;
      return [
        { width, filled: true, key: `${index}-a` },
        { width: 1, filled: false, key: `${index}-b` },
      ];
    });

  return (
    <View style={styles.barcodeWrap}>
      {bars.map((bar) => (
        <View
          key={bar.key}
          style={[
            styles.barcodeBar,
            {
              width: bar.width * 2,
              backgroundColor: bar.filled
                ? "rgba(255,255,255,0.92)"
                : "transparent",
            },
          ]}
        />
      ))}
    </View>
  );
}
