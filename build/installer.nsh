!macro customInit
  ; Одинарные кавычки по краям!
  nsExec::Exec 'taskkill /F /IM "${APP_EXECUTABLE_FILENAME}" /T'
!macroend