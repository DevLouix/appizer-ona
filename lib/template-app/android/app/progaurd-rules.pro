# Add project specific ProGuard rules here.
# By default, the flags set here are applied in addition to the ProGuard
# rules that are included in the SDK. Project-specific rules should go
# in this file.
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# You can add a rule like this to keep your custom views:
# -keep public class * extends android.view.View {
#     <init>(android.content.Context);
#     <init>(android.content.Context, android.util.AttributeSet);
#     <init>(android.content.Context, android.util.AttributeSet, int);
# }

# If you use WebView and JavaScript interfaces:
# -keepclassmembers class * {
#     @android.webkit.JavascriptInterface <methods>;
# }

# Common libraries that often need rules (add only if you use them):
# -keep class com.google.android.gms.** { *; }
# -dontwarn com.google.android.gms.**

# For AppCompat/Material Design libraries:
-keep public class androidx.appcompat.widget.** { *; }
-keep public class com.google.android.material.** { *; }
-dontwarn androidx.appcompat.widget.**
-dontwarn com.google.android.material.**

# For Kotlin (if you use Kotlin):
-keepattributes Signature
-keepattributes *Annotation*
-keep class kotlin.Metadata { *; }
-keep class !kotlin.Metadata.** { *; }
-dontwarn kotlin.**