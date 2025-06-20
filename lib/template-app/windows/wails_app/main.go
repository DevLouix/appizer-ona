package main

import (
  "embed"
  "github.com/wailsapp/wails/v2"
  "github.com/wailsapp/wails/v2/pkg/options"
  "github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed frontend/*
var assets embed.FS

type App struct{}

func NewApp() *App {
  return &App{}
}

func (a *App) Greet(name string) string {
  return "Hello, " + name + "!"
}

func main() {
  app := NewApp()
  err := wails.Run(&options.App{
    Title:  "{{APP_NAME}}",
    Width:  1024,
    Height: 768,
    Assets: assets,
	  StartUrl: "{{URL}}"
    Windows: &windows.Options{
      WebviewIsTransparent: false,
    },
    Bind: []interface{}{app},
  })

  if err != nil {
    panic(err)
  }
}
