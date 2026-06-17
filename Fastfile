default_platform(:android)

platform :android do
  desc "Build and upload to Google Play Console beta track"
  lane :upload_to_play_store_beta do
    # Build the APK
    gradle(
      task: "clean assemble",
      project_dir: "android/",
      properties: {
        "android.injected.signing.store.file" => ENV["KEYSTORE_PATH"],
        "android.injected.signing.store.password" => ENV["KEYSTORE_PASSWORD"],
        "android.injected.signing.key.alias" => ENV["KEY_ALIAS"],
        "android.injected.signing.key.password" => ENV["KEY_PASSWORD"]
      }
    )

    # Upload to Google Play Console
    upload_to_play_store(
      track: 'beta',
      aab: 'android/app/build/outputs/bundle/release/app-release.aab',
      json_key: ENV["PLAY_STORE_JSON_KEY"],
      package_name: 'space.manus.medivac.one.app',
      release_status: 'completed',
      skip_upload_metadata: false,
      skip_upload_images: false,
      skip_upload_screenshots: false
    )
  end

  desc "Upload APK to Google Play Console production track"
  lane :upload_to_play_store_production do
    upload_to_play_store(
      track: 'production',
      aab: 'android/app/build/outputs/bundle/release/app-release.aab',
      json_key: ENV["PLAY_STORE_JSON_KEY"],
      package_name: 'space.manus.medivac.one.app',
      release_status: 'completed'
    )
  end

  desc "Manage beta testers"
  lane :manage_beta_testers do
    # Add beta testers to the app
    supply(
      json_key: ENV["PLAY_STORE_JSON_KEY"],
      package_name: 'space.manus.medivac.one.app',
      track: 'beta'
    )
  end

  desc "Get app version from Google Play Console"
  lane :get_version_code do
    version_code = google_play_track_version_codes(
      json_key: ENV["PLAY_STORE_JSON_KEY"],
      package_name: 'space.manus.medivac.one.app',
      track: 'beta'
    )
    UI.message("Current beta version code: #{version_code}")
  end
end
