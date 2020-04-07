/**
 * Checks the download folder, unzips and imports all data from Google TakeOut
 */
import { unzip, subscribe } from 'react-native-zip-archive';
import { MergeJSONWithLocalData } from '../helpers/GoogleData';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

let progress;
const MONTHS = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];
/**
 * Safe paths is interested in locations for latest a couple of weeks.
 * Date for latest 2 months should be sufficient to cover all cases,
 * especially the case when we are in the early days of the current month.
 * @returns {Array[string]} - array of files for latest 2 months from google takeout archive
 */
function getFilenamesForLatest2Months(rootPath) {
  const now = new Date();
  const previousMonth = new Date();
  previousMonth.setMonth(now.getMonth() - 1);

  return [previousMonth, now].map(date => {
    const year = date.getFullYear();
    const monthStr = MONTHS[date.getMonth()];
    return (
      `${rootPath}/Takeout/Location History/Semantic Location History/${year}/` +
      `${year}_${monthStr}.json`
    );
  });
}

// Imports any Takeout location data
// Currently works for Google Takeout Location data
export async function ImportTakeoutData(filePath) {
  let unifiedPath = filePath;

  if (Platform.OS === 'ios') {
    unifiedPath = filePath.replace('file://', '');
  }
  // UnZip Progress Bar Log.
  // progress callback is required by unzip().
  progress = subscribe(
    ({
      progress,
      //  unifiedPath
    }) => {
      if (Math.trunc(progress * 100) % 10 === 0)
        console.log('[INFO] Unzipping', Math.trunc(progress * 100), '%');
    },
  );
  const extractDir = `${
    RNFS.CachesDirectoryPath
  }/Takeout-${new Date().toISOString()}`;
  console.log('[INFO] Takeout import start. Path:', unifiedPath);
  let path;
  try {
    path = await unzip(unifiedPath, extractDir);
    console.log(`[INFO] Unzip Completed for ${path}`);
    const monthlyLocationFiles = getFilenamesForLatest2Months(path);
    for (const filepath of monthlyLocationFiles) {
      console.log('[INFO] File to import:', filepath);

      const isExist = await RNFS.exists(filepath);
      if (isExist) {
        const contents = await RNFS.readFile(filepath);

        await MergeJSONWithLocalData(JSON.parse(contents));
        console.log('[INFO] Imported file:', filepath);
      }
    }
  } catch (err) {
    console.error('[Error] Failed to import Google Takeout', err);
  }
  if (path) {
    // clean up the extracted folder
    await RNFS.unlink(path);
  }
  progress.remove();
}
