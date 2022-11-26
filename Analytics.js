// NOTE: All dates/times should be stored as ISO strings.
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
        // Int indicating which grouping of 3 runs it belongs to
        "cluster_id",
        // Int incremented any time we click "start"
        "round_id",
        "round_duration",
        "round_start_at",
        "got_game_over",
        "round_over_at",
        "last_int_completed_at",
        "cognitive_load",
        "lines_cleared",
        "game_score",
        "improve_hci_enabled",
        "interrupts_enabled",
        // -------------------------------------------------- //
        // Total num/time/and avg of all interrupts
        "global_int_completed",
        "global_int_total_time",
        "global_int_avg_time",
        // Track num times individual interruption was completed
        "arrangement_completed", 
        "longest_word_completed",
        "sliding_completed",
        "spatial_completed",
        "typing_completed",
        // Track total time spent performing a given interrupt
        "arrangement_total_time", 
        "longest_word_total_time",
        "sliding_total_time",
        "spatial_total_time",
        "typing_total_time",
        // Track avg time spent performing a specific int
        "arrangement_avg_time", 
        "longest_word_avg_time",
        "sliding_avg_time",
        "spatial_avg_time",
        "typing_avg_time",
        // -------------------------------------------------- //
      ]
    ]
    this.currentDataRow = {}
    this.currentInterruptionStartTime;
    this.currentInterruptionEndTime;
    this.currentInterruptionName;
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

    var selection = '';
    do {
      selection = parseInt(window.prompt(
        "Please rate your cognitive load on a scale from 1-10 following \
        the previous round of tasks.\
        \n1: very very low cognitive load or effort\
        \n10: extreme cognitive load or effort",
        ""), 10);
    } while (isNaN(selection) || selection > 10 || selection < 1);
    this.currentDataRow['cognitive_load'] = selection;

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

  /**
   * Function to track counts and durations of interruptions, both
   * global and specific.
   * 
   * @param {String} startOrStop 'start' indicates we want to begin tracking.
   * any other value indicates we want to stop the current tracking.
   * @param {String} intName string name of a given interruption.
   */
  trackInterruption(startOrStop, intName) {
    if (intName == undefined) {return;}
    if (startOrStop == 'start') {
      this.currentInterruptionStartTime = new Date().toISOString();
    } else {
      this.currentInterruptionEndTime = new Date().toISOString();
      let duration = this.getTimeDiffInSeconds(
        this.currentInterruptionStartTime,
        this.currentInterruptionEndTime
      )
      this.updateIntDurationAvg(duration, 'global_int');
      this.updateIntDurationAvg(duration, intName);
      this.currentDataRow['last_int_completed_at'] = this.currentInterruptionEndTime;
    }
  }

  /**
   * Update time data for a specific interruption.
   * 
   * @param {Float} intDuration the number of seconds this interruption took
   * to complete 
   * @param {String} intName the name of the specific interruption
   */
  updateIntDurationAvg(intDuration, intName) {
    let tt = this.currentDataRow[`${intName}_total_time`];
    let c = this.currentDataRow[`${intName}_completed`];

    tt = tt == "" ? intDuration : tt + intDuration;
    c = c == "" ? 1 : c += 1;

    this.currentDataRow[`${intName}_total_time`] = tt;
    this.currentDataRow[`${intName}_completed`] = c;
    this.currentDataRow[`${intName}_avg_time`] = tt / c;
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