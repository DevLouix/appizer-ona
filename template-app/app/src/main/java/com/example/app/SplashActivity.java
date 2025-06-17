package com.example.app; // This will be updated by the Python script

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.graphics.Color;
import android.view.WindowManager;
import androidx.appcompat.app.AppCompatActivity;
import android.widget.ImageView;
import android.widget.TextView;
import android.view.Gravity;
import android.view.ViewGroup.LayoutParams;
import android.widget.LinearLayout;
import android.util.TypedValue; // For converting dp to px

public class SplashActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Fullscreen setting for splash
        if ({{FULLSCREEN}}) {
            getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                                 WindowManager.LayoutParams.FLAG_FULLSCREEN);
        }

        // Set the background color
        LinearLayout splashLayout = new LinearLayout(this);
        splashLayout.setLayoutParams(new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
        splashLayout.setOrientation(LinearLayout.VERTICAL);
        splashLayout.setGravity(Gravity.CENTER);
        splashLayout.setBackgroundColor(Color.parseColor("{{SPLASH_BACKGROUND_COLOR}}"));

        // Handle splash content type
        String splashType = "{{SPLASH_TYPE}}";
        if (splashType.equals("image")) {
            ImageView imageView = new ImageView(this);
            // Assuming splash.png or the file name from config.splash.content is in drawable
            // You should make sure your drawable resource name matches what's expected.
            // For example, if config.splash.content is "my_custom_splash.png",
            // you'd reference R.drawable.my_custom_splash
            // For simplicity, assuming the copied image is always named "splash.png" or "my_splash.png"
            // The resource_generator copies it with its original filename.
            String splashContentName = "{{SPLASH_CONTENT}}"; // This placeholder will be the content value (e.g., "my_splash.png")
            // Extract the name without extension for resource ID
            String drawableName = splashContentName.substring(0, splashContentName.lastIndexOf('.'));
            int imageResId = getResources().getIdentifier(drawableName, "drawable", getPackageName());

            if (imageResId != 0) {
                imageView.setImageResource(imageResId);
                imageView.setScaleType(ImageView.ScaleType.FIT_CENTER); // Adjust scale type as needed
                // Optionally set layout params for the image, e.g., max width/height
                LinearLayout.LayoutParams imgParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                );
                imgParams.setMargins(0, 0, 0, (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 20, getResources().getDisplayMetrics())); // Example margin
                imageView.setLayoutParams(imgParams);
                splashLayout.addView(imageView);
            } else {
                // Fallback or error if image not found
                TextView errorText = new TextView(this);
                errorText.setText("Splash Image Not Found!");
                errorText.setTextColor(Color.RED);
                errorText.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
                splashLayout.addView(errorText);
            }
        } else { // Default to color or text splash if not image
            TextView appNameText = new TextView(this);
            appNameText.setText("{{APP_NAME}}"); // Use the app name for basic text splash
            appNameText.setTextColor(Color.parseColor("{{SPLASH_TEXT_COLOR}}"));
            appNameText.setTextSize(TypedValue.COMPLEX_UNIT_SP, 36);
            appNameText.setGravity(Gravity.CENTER);
            splashLayout.addView(appNameText);
        }

        setContentView(splashLayout);

        // Delay and then start MainActivity
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                Intent intent = new Intent(SplashActivity.this, MainActivity.class);
                startActivity(intent);
                finish(); // Close splash activity
            }
        }, {{SPLASH_DURATION}});
    }
}