import { Disposable, StatusBarItem, workspace } from 'coc.nvim';
import { WorkDoneProgressBegin, WorkDoneProgressEnd, WorkDoneProgressReport, ProgressType } from 'vscode-languageserver-protocol';

type ProgressParams = WorkDoneProgressBegin | WorkDoneProgressReport | WorkDoneProgressEnd;

function EmptyIfUndefined(a?: string): string {
  if (a == undefined) {
    return '';
  } else {
    return ` ${a}`;
  }
}

export class StatusDisplay implements Disposable {
  private Statusbar: StatusBarItem;
  private isStartingup: boolean;
  private isCargoChecking: boolean;
  private Subtext?: string;
  private Percentage?: string;

  constructor(command: string) {
    this.Statusbar = workspace.createStatusBarItem(0);
    this.isStartingup = false;
    this.isCargoChecking = false;
  }

  private show() {
    const CurrentStatus = (() => {
      if (this.isStartingup) return 'Starting up';
      else if (this.isCargoChecking) return 'Cargocheck';
      else return 'Idle';
    })();

    this.Statusbar.text = `RustAnalyzer: ${CurrentStatus}${EmptyIfUndefined(this.Subtext)}${EmptyIfUndefined(this.Percentage)}`;
    this.Statusbar.show();
  }

  public dispose() {
    this.Statusbar.dispose();
  }

  private SetSubTexts(params: ProgressParams) {
    if (params.message != null) {
      this.Subtext = params.message;
    }

    if (params.kind == 'end') {
      return;
    }

    if (params.percentage != null) {
      this.Percentage = `${Math.round(params.percentage * 100) / 100}%`;
    }
  }

  public handleProgressNotification(params: ProgressParams) {
    switch (params.kind) {
      case 'begin':
        this.Statusbar.isProgress = true;
        this.isCargoChecking = true;
        this.SetSubTexts(params);
        break;

      case 'report':
        this.SetSubTexts(params);
        break;

      case 'end':
        this.Statusbar.isProgress = false;
        this.isCargoChecking = false;
        this.Percentage = undefined;
        this.Subtext = undefined;
        break;
    }
    this.show();
  }

  public handleStartupProgressNotification(params: ProgressParams) {
    switch (params.kind) {
      case 'begin':
        this.Statusbar.isProgress = true;
        this.isStartingup = true;
        this.SetSubTexts(params);
        break;

      case 'report':
        this.SetSubTexts(params);
        break;

      case 'end':
        this.Statusbar.isProgress = false;
        this.isStartingup = false;
        this.Percentage = undefined;
        this.Subtext = undefined;
        break;
    }
    this.show();
  }
}
