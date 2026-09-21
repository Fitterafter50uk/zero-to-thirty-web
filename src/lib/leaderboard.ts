import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

const LEADERBOARD_ID_KEY =
  'zero_to_thirty_leaderboard_id';

const LEADERBOARD_NAME_KEY =
  'zero_to_thirty_leaderboard_name';

function createId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    (c) => {
      const r =
        (Math.random() * 16) | 0;

      const v =
        c === 'x'
          ? r
          : (r & 0x3) | 0x8;

      return v.toString(16);
    }
  );
}

export async function getLeaderboardId(): Promise<string> {
  let id =
    await AsyncStorage.getItem(
      LEADERBOARD_ID_KEY
    );

  if (!id) {
    id = createId();

    await AsyncStorage.setItem(
      LEADERBOARD_ID_KEY,
      id
    );
  }

  return id;
}

export async function getRunnerName(): Promise<string | null> {
  return await AsyncStorage.getItem(
    LEADERBOARD_NAME_KEY
  );
}

export async function setRunnerName(
  name: string
): Promise<string> {
  const cleanName =
    name.trim().slice(0, 30);

  if (!cleanName) {
    throw new Error(
      'Please enter a name.'
    );
  }

  await AsyncStorage.setItem(
    LEADERBOARD_NAME_KEY,
    cleanName
  );

  return cleanName;
}

export async function saveLeaderboardRun({
  km,
  runType,
  weekNumber = 0,
  runNumber = 0,
}: {
  km: number;
  runType: 'programme' | 'free';
  weekNumber?: number;
  runNumber?: number;
}): Promise<boolean> {
  const userId =
    await getLeaderboardId();

  const storedName =
    await getRunnerName();

  const runnerName =
    storedName?.trim() ||
    'Runner';

  const distance =
    Number(km);

  if (
    !Number.isFinite(distance) ||
    distance <= 0
  ) {
    throw new Error(
      `Invalid distance: ${km}`
    );
  }

  const roundedKm =
    Math.round(
      distance * 100
    ) / 100;

  const now =
    new Date();

  const runDate =
    [
      now.getFullYear(),
      String(
        now.getMonth() + 1
      ).padStart(2, '0'),
      String(
        now.getDate()
      ).padStart(2, '0'),
    ].join('-');

  const row = {
    user_id:
      userId,

    runner_name:
      runnerName,

    km:
      roundedKm,

    week_number:
      runType === 'programme'
        ? Number(weekNumber)
        : 0,

    run_number:
      runType === 'programme'
        ? Number(runNumber)
        : 0,

    run_type:
      runType,

    run_date:
      runDate,
  };

  console.log(
    'ZERO TO THIRTY LEADERBOARD ROW:',
    row
  );

  const { error } =
    await supabase
      .from('leaderboard_runs')
      .insert(row);

  if (error) {
    console.error(
      'ZERO TO THIRTY LEADERBOARD ERROR:',
      error
    );

    throw error;
  }

  console.log(
    'ZERO TO THIRTY LEADERBOARD SAVE SUCCESS:',
    row
  );

  return true;
}