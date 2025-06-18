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

    try {
        splashLayout.setBackgroundColor(Color.parseColor("{{SPLASH_BACKGROUND_COLOR}}"));
    } catch (IllegalArgumentException e) {
        splashLayout.setBackgroundColor(Color.BLACK); // fallback
    }

    // Handle splash content type
    String splashType = "{{SPLASH_TYPE}}";
    if (splashType != null && splashType.equals("image")) {
        String splashContentName = "{{SPLASH_CONTENT}}";

        if (splashContentName != null && splashContentName.contains(".")) {
            try {
                String drawableName = splashContentName.substring(0, splashContentName.lastIndexOf('.'));
                int imageResId = getResources().getIdentifier(drawableName, "drawable", getPackageName());

                if (imageResId != 0) {
                    ImageView imageView = new ImageView(this);
                    imageView.setImageResource(imageResId);
                    imageView.setScaleType(ImageView.ScaleType.FIT_CENTER);

                    LinearLayout.LayoutParams imgParams = new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                    );
                    imgParams.setMargins(0, 0, 0, (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 20, getResources().getDisplayMetrics()));
                    imageView.setLayoutParams(imgParams);
                    splashLayout.addView(imageView);
                } else {
                    addErrorText(splashLayout, "Splash image not found in drawable.");
                }
            } catch (Exception e) {
                addErrorText(splashLayout, "Error loading splash image.");
            }
        } else {
            addErrorText(splashLayout, "Invalid splash image filename.");
        }
    } else {
        TextView appNameText = new TextView(this);
        appNameText.setText("{{APP_NAME}}");
        try {
            appNameText.setTextColor(Color.parseColor("{{SPLASH_TEXT_COLOR}}"));
        } catch (IllegalArgumentException e) {
            appNameText.setTextColor(Color.WHITE);
        }
        appNameText.setTextSize(TypedValue.COMPLEX_UNIT_SP, 36);
        appNameText.setGravity(Gravity.CENTER);
        splashLayout.addView(appNameText);
    }

    setContentView(splashLayout);

    new Handler().postDelayed(new Runnable() {
        @Override
        public void run() {
            Intent intent = new Intent(SplashActivity.this, MainActivity.class);
            startActivity(intent);
            finish();
        }
    }, {{SPLASH_DURATION}});
}

// Helper method to add fallback error text
private void addErrorText(LinearLayout layout, String message) {
    TextView errorText = new TextView(this);
    errorText.setText(message);
    errorText.setTextColor(Color.RED);
    errorText.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
    errorText.setGravity(Gravity.CENTER);
    layout.addView(errorText);
}

}