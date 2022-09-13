import { useCallback, useContext, useMemo, useState } from 'react';

import useTranslation from 'next-translate/useTranslation';

import AuthorInfo from './AuthorInfo';
import HeaderMenu from './HeaderMenu';
import styles from './ReflectionItem.module.scss';
import ReflectionItemProps from './ReflectionItemProps';
import SocialInteraction from './SocialInteraction';

import VerseAndTranslation from '@/components/Verse/VerseAndTranslation';
import DataContext from '@/contexts/DataContext';
import { getChapterData } from '@/utils/chapter';
import { logButtonClick } from '@/utils/eventLogger';
import truncate from '@/utils/html-truncate';
import { isRTLReflection } from '@/utils/quranReflect/locale';
import { getQuranReflectTagUrl } from '@/utils/quranReflect/navigation';
import { makeVerseKey } from '@/utils/verse';

const MAX_REFLECTION_LENGTH = 220;

const ReflectionItem = ({
  id,
  authorName,
  authorUsername,
  date,
  avatarUrl,
  reflectionText,
  isAuthorVerified,
  verseReferences,
  likesCount,
  commentsCount,
  reflectionGroup,
  reflectionGroupLink,
  selectedChapterId,
  selectedVerseNumber,
  reflectionLanguage,
  trimmedCitationTexts,
  filters,
}: ReflectionItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();
  const [shouldShowReferredVerses, setShouldShowReferredVerses] = useState(false);
  const chaptersData = useContext(DataContext);

  const onReferredVersesHeaderClicked = () => {
    setShouldShowReferredVerses((prevShouldShowReferredVerses) => {
      logButtonClick(
        // eslint-disable-next-line i18next/no-literal-string
        `reflection_item_reference_${prevShouldShowReferredVerses ? 'close' : 'open'}`,
      );
      return !prevShouldShowReferredVerses;
    });
  };

  const onMoreLessClicked = () => {
    setIsExpanded((prevIsExpanded) => {
      // eslint-disable-next-line i18next/no-literal-string
      logButtonClick(`reflection_item_show_${prevIsExpanded ? 'less' : 'more'}`);
      return !prevIsExpanded;
    });
  };

  // some reference, are referencing to the entire chapter (doesn't have from/to properties)
  // we only want to show the data for references that have from/to properties
  const nonChapterVerseReferences = useMemo(
    () => verseReferences.filter((verse) => !!verse.from && !!verse.to),
    [verseReferences],
  );

  const getSurahName = useCallback(
    (chapterNumber) => {
      const surahName = getChapterData(chaptersData, chapterNumber.toString())?.transliteratedName;
      return `${t('common:surah')} ${surahName} (${chapterNumber})`;
    },
    [chaptersData, t],
  );

  const formattedText = useMemo(
    () =>
      reflectionText
        .split(' ')
        .map((word) => {
          if (word.trim().startsWith('#')) {
            // eslint-disable-next-line i18next/no-literal-string
            return `<a target="_blank" href="${getQuranReflectTagUrl(word)}" class="${
              styles.hashtag
            }">${word}</a>`;
          }

          return word;
        })
        .join(' ')
        .replace(/\r\n/g, '<br>'),
    [reflectionText],
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <AuthorInfo
          authorUsername={authorUsername}
          authorName={authorName}
          avatarUrl={avatarUrl}
          date={date}
          isAuthorVerified={isAuthorVerified}
          reflectionGroup={reflectionGroup}
          reflectionGroupLink={reflectionGroupLink}
          verseReferences={verseReferences}
          nonChapterVerseReferences={nonChapterVerseReferences}
          onReferredVersesHeaderClicked={onReferredVersesHeaderClicked}
          shouldShowReferredVerses={shouldShowReferredVerses}
        />
        <HeaderMenu
          postId={id}
          selectedChapterId={selectedChapterId}
          selectedVerseNumber={selectedVerseNumber}
        />
      </div>
      {shouldShowReferredVerses && nonChapterVerseReferences?.length > 0 && (
        <div className={styles.verseAndTranslationsListContainer}>
          {nonChapterVerseReferences.map(({ chapter, from, to }) => (
            <div
              className={styles.verseAndTranslationContainer}
              key={makeVerseKey(chapter, from, to)}
            >
              {verseReferences.length > 1 && (
                <span className={styles.surahName}>{getSurahName(chapter)}</span>
              )}
              <VerseAndTranslation chapter={chapter} from={from} to={to} />
            </div>
          ))}
        </div>
      )}
      <div className={isRTLReflection(reflectionLanguage) ? styles.rtl : styles.ltr}>
        <span
          className={styles.body}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: isExpanded ? formattedText : truncate(formattedText, MAX_REFLECTION_LENGTH),
          }}
        />
        {reflectionText.length > MAX_REFLECTION_LENGTH && (
          <span
            className={styles.moreOrLessText}
            tabIndex={0}
            role="button"
            onKeyDown={onMoreLessClicked}
            onClick={onMoreLessClicked}
          >
            {isExpanded ? t('quran-reader:see-less') : t('quran-reader:see-more')}
          </span>
        )}
      </div>
      <SocialInteraction
        filters={filters}
        reflectionText={reflectionText}
        likesCount={likesCount}
        trimmedCitationTexts={trimmedCitationTexts}
        commentsCount={commentsCount}
        postId={id}
      />
    </div>
  );
};

export default ReflectionItem;
