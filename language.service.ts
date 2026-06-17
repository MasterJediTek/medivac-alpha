    }
    const minutes = Math.floor(seconds / 60);
    return `${minutes} ${this.translate('minutes')}`;
  }
}

export const languageService = LanguageService.getInstance();
