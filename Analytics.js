/**
 * Data to track:
 *  X cluster_id: (should be int indicating which grouping of 3 runs it belongs to)
 *  X round_id: incrementing int ID. This should be incremented any time we click "start"
 *  X round_duration: duration of round in seconds (floating point)
 *  X round_start_at: ISO date string of moment "start" was pressed
 *  X got_game_over: boolean (1/0) indicating failure at block game
 *  X round_over_at: ISO date string of moment user failed block game
 *  X num_interruptions_complete: int counter indicating how many successful interruptions occured (tie to hideInterruptions)
 *  X total_int_time_to_complete: total time spent doing interruptions
 *  X avg_int_time_to_complete: average duration of interruptions in seconds (calculated in JS as each interruption finishes)
 *  X last_int_completed_at: ISO date string of moment interruption was successfully completed
 *  X cognitive_load: int from 0-9 or 1-10 entered by the user at end of each round
 *  X lines_cleared: num of lines from block game use successfully cleared
 *  X game_score: game score from block game (not important, but may be helpful?)
 *  X improve_hci_enabled: boolean (1/0) 
 *  X interrupts_enabled: boolean (1/0) 
 */

class Analytics {
  constructor() {
    // Random large(ish) number, essentially a session identifier.
    // This is applied to all rows of data collected by this instance
    // of the analytics class.
    this.clusterId = Math.floor(Math.random() * Math.random() * 1000000)
    this.roundId = -1;
    // Initialize the CSV + header row
    this.csv = [
      [
        "cluster_id",
        "round_id",
        "round_duration",
        "round_start_at",
        "got_game_over",
        "round_over_at",
        "num_interruptions_complete",
        "total_int_time_to_complete",
        "avg_int_time_to_complete",
        "last_int_completed_at",
        "cognitive_load",
        "lines_cleared",
        "game_score",
        "improve_hci_enabled",
        "interrupts_enabled",
      ]
    ]
    this.currentDataRow = {}
    this.currentInterruptionStartTime;
    this.currentInterruptionEndTime;
    this.init();
  }
  init() {
    // It's easier to interact with JSON for saving data, so 
    // populate JSON obj with all column headers that we'll use in CSV:
    this.csv[0].forEach(k => this.currentDataRow[k] = "")
    this.currentDataRow['cluster_id'] = this.clusterId;
    this.currentDataRow['round_id'] = this.roundId;
    this.currentDataRow['lines_cleared'] = 0;
  }

  // Called when round begins
  start() {
    this.roundId += 1;
    this.currentDataRow['round_id'] = this.roundId;
    this.currentDataRow['round_start_at'] = new Date().toISOString();
  }

  // Called when round ends either due to timeout or a game over
  end() {
    this.currentDataRow['round_over_at'] = new Date().toISOString();

    this.currentDataRow['round_duration'] = this.getTimeDiffInSeconds(
      this.currentDataRow['round_start_at'],
      this.currentDataRow['round_over_at']
    )

    this.currentDataRow['game_score'] = account.score;

    // TODO: add check to make sure their input is valid?
    this.currentDataRow['cognitive_load'] = prompt(
      "Please rate your cognitive load on a scale from 1-10 following \
      the previous round of tasks.\
      \n1: very very low cognitive load or effort\
      \n10: extreme cognitive load or effort"
    );

    this.addRowDataToCSV();
  }

  /**
   * Take current JSON analytic data and create a row from it in the CSV,
   * then clear the JSON object in preparation of creating another row.
   * 
   * This should be called at the end of every round (e.g. when we get a
   * game over)
   */
  addRowDataToCSV() {
    let row = [];
    Object.keys(this.currentDataRow).forEach(k => row.push(this.currentDataRow[k]));
    this.csv.push(row);
    // Clear current row data from JSON obj so we can track a new round
    Object.keys(this.currentDataRow).forEach(k => this.currentDataRow[k] = "");
    this.currentDataRow['cluster_id'] = this.clusterId;
  }

  trackInterruption(startOrStop) {
    if (startOrStop == 'start') {
      this.currentInterruptionStartTime = new Date().toISOString();
    } else {
      this.currentInterruptionEndTime = new Date().toISOString();
      this.updateIntDurationAvg(this.getTimeDiffInSeconds(
        this.currentInterruptionStartTime,
        this.currentInterruptionEndTime
      ))
      this.currentDataRow['last_int_completed_at'] = this.currentInterruptionEndTime;
    }
  }

  /**
   * Update overall average time per interruption
   * 
   * @param {Float} intDuration the number of seconds the latest interruption took
   * to complete
   */
  updateIntDurationAvg(intDuration) {
    let a = this.currentDataRow['total_int_time_to_complete'];
    let b = this.currentDataRow['num_interruptions_complete'];

    a = a == "" ? intDuration : a + intDuration;
    b = b == "" ? 1 : b += 1;

    this.currentDataRow['total_int_time_to_complete'] = a;
    this.currentDataRow['avg_int_time_to_complete'] = a / b;
    this.currentDataRow['num_interruptions_complete'] = b;
  }

  /**
   * Takes a start and end time in ISO date string and 
   * returns the number of seconds between them as a float.
   * 
   * @param {ISO Date String} start A start time
   * @param {ISO Date String} end An end time
   */
  getTimeDiffInSeconds(start, end) {
    return (new Date(end) - new Date(start)) / 1000;
  }

  /**
   * Convert a 2D array into a CSV string
   * Source: https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
   * 
   * @param {Array} data 2D array representing CSV rows
   * @returns a valid CSV string
   */
  arrayToCsv(data) {
    return data.map(row =>
      row
        .map(String)  // convert every value to String
        .map(v => v.replaceAll('"', '""'))  // escape double colons
        .map(v => `"${v}"`)  // quote it
        .join(',')  // comma-separated
    ).join('\r\n');  // rows starting on new lines
  }

  /**
   * Download contents as a file
   * Source: https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
   * 
   * @param {*} content A CSV string or some other such content
   * @param {String} filename filename of target download
   * @param {String} contentType meta type, e.g. 'text/csv;charset=utf-8;'
   */
  downloadBlob(content, filename, contentType) {
    // Create a blob
    var blob = new Blob([content], { type: contentType });
    var url = URL.createObjectURL(blob);

    // Create a link to download it
    var pom = document.createElement('a');
    pom.href = url;
    pom.setAttribute('download', filename);
    pom.click();
  }

  /**
   * Dump CSV 2D array into actual CSV string and download blob.
   */
  exportAllData() {
    let csv = this.arrayToCsv(this.csv);
    this.downloadBlob(csv, `${this.clusterId}_data.csv`, 'text/this.csv;charset=utf-8;');
  }

}