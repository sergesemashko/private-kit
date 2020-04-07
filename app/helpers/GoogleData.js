/**
 * Import a Google JSon into the Database.
 */
import { GetStoreData, SetStoreData } from '../helpers/General';

function BuildLocalFormat(placeVisit) {
  return {
    latitude: placeVisit.location.latitudeE7 * 10 ** -7,
    longitude: placeVisit.location.longitudeE7 * 10 ** -7,
    time: placeVisit.duration.startTimestampMs,
  };
}

function LocationExists(localDataJSON, loc) {
  for (const storedLoc of localDataJSON) {
    if (
      storedLoc.latitude === loc.latitude &&
      storedLoc.longitude === loc.longitude &&
      storedLoc.time === loc.time
    ) {
      return true;
    }
  }

  return false;
}

function InsertIfNew(localDataJSON, loc) {
  if (!LocationExists(localDataJSON, loc)) {
    console.log('Importing', loc);
    localDataJSON.push(loc);
  } else {
    console.log('Existing', loc, localDataJSON.indexOf(loc));
  }
}

function Merge(localDataJSON, googleDataJSON) {
  googleDataJSON.timelineObjects.map(function(
    data,
    //index
  ) {
    // Only import visited places, not paths for now
    if (data.placeVisit) {
      let loc = BuildLocalFormat(data.placeVisit);
      InsertIfNew(localDataJSON, loc);
    }
  });
}

export async function MergeJSONWithLocalData(googleDataJSON) {
  const locationArray = await GetStoreData('LOCATION_DATA');
  let locationData;

  if (locationArray !== null) {
    locationData = JSON.parse(locationArray);
  } else {
    locationData = [];
  }

  Merge(locationData, googleDataJSON);

  return SetStoreData('LOCATION_DATA', locationData);
}
