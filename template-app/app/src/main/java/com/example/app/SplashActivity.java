package com.example.app; // This will be updated by the Python script

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.graphics.Color;
import android.view.WindowManager;
import androidx.appcompat.app.AppCompatActivity;
import android.widget.ImageView;
import android.widget.TextView;
import android.view.Gravity;
import android.widget.LinearLayout;
import android.util.TypedValue;

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
        splashLayout.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT));
        splashLayout.setOrientation(LinearLayout.VERTICAL);
        splashLayout.setGravity(Gravity.CENTER);
        splashLayout.setBackgroundColor(Color.parseColor("{{SPLASH_BACKGROUND_COLOR}}"));

        // Handle splash content type
        String splashType = "{{SPLASH_TYPE}}";
        if (splashType.equals("image")) {
            ImageView imageView = new ImageView(this);
            String splashContentName = "{{SPLASH_CONTENT}}";
            int dotIndex = splashContentName.lastIndexOf('.');
            String drawableName = dotIndex != -1
                    ? splashContentName.substring(0, dotIndex)
                    : splashContentName;

            int imageResId = getResources().getIdentifier(drawableName, "drawable", getPackageName());

            if (imageResId != 0) {
                imageView.setImageResource(imageResId);
                imageView.setScaleType(ImageView.ScaleType.FIT_CENTER);

                LinearLayout.LayoutParams imgParams = new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT);
                imgParams.setMargins(0, 0, 0,
                        (int) TypedValue.applyDimension(
                                TypedValue.COMPLEX_UNIT_DIP,
                                20,
                                getResources().getDisplayMetrics()));
                imageView.setLayoutParams(imgParams);
                splashLayout.addView(imageView);
            } else {
                TextView errorText = new TextView(this);
                errorText.setText("Splash Image Not Found!");
                errorText.setTextColor(Color.RED);
                errorText.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
                splashLayout.addView(errorText);
            }
        } else {
            TextView appNameText = new TextView(this);
            appNameText.setText("{{APP_NAME}}");
            appNameText.setTextColor(Color.parseColor("{{SPLASH_TEXT_COLOR}}"));
            appNameText.setTextSize(TypedValue.COMPLEX_UNIT_SP, 36);
            appNameText.setGravity(Gravity.CENTER);
            splashLayout.addView(appNameText);
        }

        setContentView(splashLayout);

        // Delay and then start MainActivity
        new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
            @Override
            public void run() {
                Intent intent = new Intent(SplashActivity.this, MainActivity.class);
                startActivity(intent);
                finish();
            }
        }, {{SPLASH_DURATION}});
    }
}
