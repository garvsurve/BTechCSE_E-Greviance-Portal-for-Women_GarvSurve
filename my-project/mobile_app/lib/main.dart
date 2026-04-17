import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

const String kApiBaseUrl = 'http://localhost:4000';

class UserProfile {
  final String id;
  final String phone;
  final String name;
  final String village;
  final String block;
  final String district;
  final String state;

  const UserProfile({
    required this.id,
    required this.phone,
    required this.name,
    required this.village,
    required this.block,
    required this.district,
    required this.state,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: (json['id'] ?? '').toString(),
      phone: (json['phone'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      village: (json['village'] ?? '').toString(),
      block: (json['block'] ?? '').toString(),
      district: (json['district'] ?? '').toString(),
      state: (json['state'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'phone': phone,
      'name': name,
      'village': village,
      'block': block,
      'district': district,
      'state': state,
    };
  }
}

class AuthSession {
  final String token;
  final UserProfile user;

  const AuthSession({required this.token, required this.user});
}

class AuthStorage {
  static const _kTokenKey = 'auth_token';
  static const _kUserKey = 'auth_user_json';

  static Future<AuthSession?> load() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_kTokenKey);
    final userRaw = prefs.getString(_kUserKey);
    if (token == null || token.trim().isEmpty) return null;
    if (userRaw == null || userRaw.trim().isEmpty) return null;
    try {
      final parsed = jsonDecode(userRaw) as Map<String, dynamic>;
      final user = UserProfile.fromJson(parsed);
      if (user.id.trim().isEmpty) return null;
      return AuthSession(token: token, user: user);
    } catch (_) {
      return null;
    }
  }

  static Future<void> save(AuthSession session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kTokenKey, session.token);
    await prefs.setString(_kUserKey, jsonEncode(session.user.toJson()));
  }

  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kTokenKey);
    await prefs.remove(_kUserKey);
  }
}

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rural Women Grievance',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        // This is the theme of your application.
        //
        // TRY THIS: Try running your application with "flutter run". You'll see
        // the application has a purple toolbar. Then, without quitting the app,
        // try changing the seedColor in the colorScheme below to Colors.green
        // and then invoke "hot reload" (save your changes or press the "hot
        // reload" button in a Flutter-supported IDE, or press "r" if you used
        // the command line to start the app).
        //
        // Notice that the counter didn't reset back to zero; the application
        // state is not lost during the reload. To reset the state, use hot
        // restart instead.
        //
        // This works for code too, not just values: Most code changes can be
        // tested with just a hot reload.
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
      ),
      home: const MainShell(),
    );
  }
}

class ProfileFooter extends StatelessWidget {
  final AuthSession? session;
  final VoidCallback onLogin;
  final VoidCallback onLogout;
  final VoidCallback onEditProfile;

  const ProfileFooter({
    super.key,
    required this.session,
    required this.onLogin,
    required this.onLogout,
    required this.onEditProfile,
  });

  @override
  Widget build(BuildContext context) {
    final s = session;
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 10, 12, 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            blurRadius: 18,
            offset: Offset(0, 6),
            color: Color(0x1A0F172A),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: const Color(0xFFF3E8FF),
            child: Text(
              s == null
                  ? 'G'
                  : (s.user.name.trim().isEmpty ? 'U' : s.user.name.trim()[0])
                      .toUpperCase(),
              style: const TextStyle(
                color: Color(0xFF4C1D95),
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  s == null
                      ? 'Guest'
                      : (s.user.name.trim().isEmpty ? 'User' : s.user.name),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  s == null
                      ? 'Login/Signup to save identity & track complaints'
                      : s.user.phone,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF475569),
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (s == null)
            FilledButton(
              onPressed: onLogin,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF4C1D95),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
              child: const Text('Login'),
            )
          else
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  onPressed: onEditProfile,
                  tooltip: 'Edit profile',
                  icon: const Icon(Icons.edit_outlined),
                ),
                IconButton(
                  onPressed: onLogout,
                  tooltip: 'Logout',
                  icon: const Icon(Icons.logout),
                ),
              ],
            ),
        ],
      ),
    );
  }
}

class AuthSheet extends StatefulWidget {
  final Future<void> Function(AuthSession session) onSuccess;

  const AuthSheet({super.key, required this.onSuccess});

  @override
  State<AuthSheet> createState() => _AuthSheetState();
}

class _AuthSheetState extends State<AuthSheet> {
  final _phone = TextEditingController();
  final _otp = TextEditingController(text: '7532');

  final _name = TextEditingController();
  final _village = TextEditingController();
  final _block = TextEditingController();
  final _district = TextEditingController();
  final _state = TextEditingController();

  bool _requested = false;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _phone.dispose();
    _otp.dispose();
    _name.dispose();
    _village.dispose();
    _block.dispose();
    _district.dispose();
    _state.dispose();
    super.dispose();
  }

  Future<void> _requestOtp() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final res = await http.post(
        Uri.parse('$kApiBaseUrl/api/auth/request-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'phone': _phone.text.trim()}),
      );
      if (res.statusCode != 200) {
        setState(() {
          _error = 'Failed to request OTP.';
        });
        return;
      }
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final devOtp = (data['devOtp'] ?? '').toString();
      if (devOtp.trim().isNotEmpty) {
        _otp.text = devOtp;
      }
      setState(() {
        _requested = true;
      });
    } catch (e) {
      setState(() {
        _error = 'Network error while requesting OTP.';
      });
    } finally {
      setState(() {
        _busy = false;
      });
    }
  }

  Future<void> _verifyOtp() async {
    final phone = _phone.text.trim();
    final otp = _otp.text.trim();

    if (phone.isEmpty) {
      setState(() {
        _error = 'Phone is required.';
      });
      return;
    }
    if (otp.isEmpty) {
      setState(() {
        _error = 'OTP is required.';
      });
      return;
    }
    if (_name.text.trim().isEmpty ||
        _village.text.trim().isEmpty ||
        _block.text.trim().isEmpty ||
        _district.text.trim().isEmpty) {
      setState(() {
        _error = 'Please fill your name and address details.';
      });
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final res = await http.post(
        Uri.parse('$kApiBaseUrl/api/auth/verify-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'phone': phone,
          'otp': otp,
          'profile': {
            'name': _name.text.trim(),
            'village': _village.text.trim(),
            'block': _block.text.trim(),
            'district': _district.text.trim(),
            'state': _state.text.trim(),
          },
        }),
      );

      if (res.statusCode != 200) {
        setState(() {
          _error = 'Invalid OTP. Please use 7532 for now.';
        });
        return;
      }

      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final token = (data['token'] ?? '').toString();
      final userRaw = data['user'];
      if (token.trim().isEmpty || userRaw is! Map<String, dynamic>) {
        setState(() {
          _error = 'Login failed.';
        });
        return;
      }

      final user = UserProfile.fromJson(userRaw);
      await widget.onSuccess(AuthSession(token: token, user: user));
    } catch (e) {
      setState(() {
        _error = 'Network error while verifying OTP.';
      });
    } finally {
      setState(() {
        _busy = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 12, 16, 16 + bottomInset),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Login / Signup',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 6),
          const Text(
            'OTP is temporarily fixed to 7532 for testing.',
            style: TextStyle(color: Color(0xFF475569), fontSize: 12),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'Mobile number',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 10),
          if (_requested)
            TextField(
              controller: _otp,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'OTP',
                border: OutlineInputBorder(),
              ),
            ),
          if (_requested) const SizedBox(height: 10),
          if (_requested) ...[
            TextField(
              controller: _name,
              decoration: const InputDecoration(
                labelText: 'Full name',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _village,
              decoration: const InputDecoration(
                labelText: 'Village / Locality',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _block,
              decoration: const InputDecoration(
                labelText: 'Block / Tehsil',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _district,
              decoration: const InputDecoration(
                labelText: 'District',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _state,
              decoration: const InputDecoration(
                labelText: 'State (optional)',
                border: OutlineInputBorder(),
              ),
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 10),
            Text(
              _error!,
              style: const TextStyle(color: Colors.red, fontWeight: FontWeight.w600),
            ),
          ],
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _busy
                  ? null
                  : _requested
                      ? _verifyOtp
                      : _requestOtp,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF4C1D95),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: _busy
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(_requested ? 'Verify & Login' : 'Send OTP'),
            ),
          ),
        ],
      ),
    );
  }
}

class EditProfileSheet extends StatefulWidget {
  final AuthSession session;
  final Future<void> Function(UserProfile nextUser) onSaved;

  const EditProfileSheet({
    super.key,
    required this.session,
    required this.onSaved,
  });

  @override
  State<EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends State<EditProfileSheet> {
  late final TextEditingController _name;
  late final TextEditingController _village;
  late final TextEditingController _block;
  late final TextEditingController _district;
  late final TextEditingController _state;

  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final u = widget.session.user;
    _name = TextEditingController(text: u.name);
    _village = TextEditingController(text: u.village);
    _block = TextEditingController(text: u.block);
    _district = TextEditingController(text: u.district);
    _state = TextEditingController(text: u.state);
  }

  @override
  void dispose() {
    _name.dispose();
    _village.dispose();
    _block.dispose();
    _district.dispose();
    _state.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final res = await http.patch(
        Uri.parse('$kApiBaseUrl/api/me'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.session.token}',
        },
        body: jsonEncode({
          'profile': {
            'name': _name.text.trim(),
            'village': _village.text.trim(),
            'block': _block.text.trim(),
            'district': _district.text.trim(),
            'state': _state.text.trim(),
          },
        }),
      );

      if (res.statusCode != 200) {
        setState(() {
          _error = 'Failed to update profile.';
        });
        return;
      }

      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final userRaw = data['user'];
      if (userRaw is! Map<String, dynamic>) {
        setState(() {
          _error = 'Failed to update profile.';
        });
        return;
      }

      final next = UserProfile.fromJson(userRaw);
      await widget.onSaved(next);
    } catch (e) {
      setState(() {
        _error = 'Network error while updating profile.';
      });
    } finally {
      setState(() {
        _busy = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 12, 16, 16 + bottomInset),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Your profile',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _name,
            decoration: const InputDecoration(
              labelText: 'Full name',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _village,
            decoration: const InputDecoration(
              labelText: 'Village / Locality',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _block,
            decoration: const InputDecoration(
              labelText: 'Block / Tehsil',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _district,
            decoration: const InputDecoration(
              labelText: 'District',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _state,
            decoration: const InputDecoration(
              labelText: 'State',
              border: OutlineInputBorder(),
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 10),
            Text(
              _error!,
              style: const TextStyle(color: Colors.red, fontWeight: FontWeight.w600),
            ),
          ],
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _busy ? null : _save,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF4C1D95),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: _busy
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Save'),
            ),
          ),
        ],
      ),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  // This widget is the home page of your application. It is stateful, meaning
  // that it has a State object (defined below) that contains fields that affect
  // how it looks.

  // This class is the configuration for the state. It holds the values (in this
  // case the title) provided by the parent (in this case the App widget) and
  // used by the build method of the State. Fields in a Widget subclass are
  // always marked "final".

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0;

  void _incrementCounter() {
    setState(() {
      // This call to setState tells the Flutter framework that something has
      // changed in this State, which causes it to rerun the build method below
      // so that the display can reflect the updated values. If we changed
      // _counter without calling setState(), then the build method would not be
      // called again, and so nothing would appear to happen.
      _counter++;
    });
  }

  @override
  Widget build(BuildContext context) {
    // This method is rerun every time setState is called, for instance as done
    // by the _incrementCounter method above.
    //
    // The Flutter framework has been optimized to make rerunning build methods
    // fast, so that you can just rebuild anything that needs updating rather
    // than having to individually change instances of widgets.
    return Scaffold(
      appBar: AppBar(
        // TRY THIS: Try changing the color here to a specific color (to
        // Colors.amber, perhaps?) and trigger a hot reload to see the AppBar
        // change color while the other colors stay the same.
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        // Here we take the value from the MyHomePage object that was created by
        // the App.build method, and use it to set our appbar title.
        title: Text(widget.title),
      ),
      body: Center(
        // Center is a layout widget. It takes a single child and positions it
        // in the middle of the parent.
        child: Column(
          // Column is also a layout widget. It takes a list of children and
          // arranges them vertically. By default, it sizes itself to fit its
          // children horizontally, and tries to be as tall as its parent.
          //
          // Column has various properties to control how it sizes itself and
          // how it positions its children. Here we use mainAxisAlignment to
          // center the children vertically; the main axis here is the vertical
          // axis because Columns are vertical (the cross axis would be
          // horizontal).
          //
          // TRY THIS: Invoke "debug painting" (choose the "Toggle Debug Paint"
          // action in the IDE, or press "p" in the console), to see the
          // wireframe for each widget.
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Text('You have pushed the button this many times:'),
            Text(
              '$_counter',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ), // This trailing comma makes auto-formatting nicer for build methods.
    );
  }
}

class Complaint {
  final String id;
  final String category;
  final String description;
  final String village;
  final String status;
  final DateTime createdAt;
  final bool anonymous;

  Complaint({
    required this.id,
    required this.category,
    required this.description,
    required this.village,
    required this.status,
    required this.createdAt,
    required this.anonymous,
  });

  factory Complaint.fromJson(Map<String, dynamic> json) {
    final dynamic createdAtRaw = json['createdAt'] ?? json['submittedAt'];
    DateTime createdAt;
    if (createdAtRaw is String) {
      createdAt = DateTime.tryParse(createdAtRaw) ?? DateTime.now();
    } else {
      createdAt = DateTime.now();
    }

    return Complaint(
      id: json['id'] as String,
      category: (json['category'] ?? 'Uncategorized') as String,
      description: (json['description'] ?? '') as String,
      village: (json['village'] ?? 'Not specified') as String,
      status: (json['status'] ?? 'New') as String,
      createdAt: createdAt,
      anonymous: json['anonymous'] == true || json['anonymous'] == 1,
    );
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _selectedIndex = 0;
  bool _loading = false;

  AuthSession? _session;

  final List<Complaint> _complaints = [];

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    await _loadSession();
    await _loadComplaints();
  }

  Future<void> _loadSession() async {
    final loaded = await AuthStorage.load();
    if (!mounted) return;
    setState(() {
      _session = loaded;
    });
  }

  Future<void> _setSession(AuthSession? next) async {
    if (next == null) {
      await AuthStorage.clear();
    } else {
      await AuthStorage.save(next);
    }
    if (!mounted) return;
    setState(() {
      _session = next;
    });
    await _loadComplaints();
  }

  Future<void> _logout() async {
    final messenger = ScaffoldMessenger.of(context);
    await _setSession(null);
    if (!mounted) return;
    messenger.showSnackBar(
      const SnackBar(content: Text('Logged out successfully.')),
    );
  }

  Future<void> _showAuthSheet() async {
    if (!mounted) return;
    await showModalBottomSheet<AuthSession>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) {
        return AuthSheet(
          onSuccess: (session) async {
            Navigator.of(ctx).pop();
            final messenger = ScaffoldMessenger.of(context);
            await _setSession(session);
            if (!mounted) return;
            messenger.showSnackBar(
              SnackBar(
                content: Text(
                  'Welcome${session.user.name.trim().isEmpty ? '' : ', ${session.user.name}'}',
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _loadComplaints() async {
    setState(() {
      _loading = true;
    });

    if (_session == null) {
      setState(() {
        _complaints.clear();
        _loading = false;
      });
      return;
    }

    try {
      const mine = '?mine=1';
      final headers = <String, String>{};
      if (_session != null) {
        headers['Authorization'] = 'Bearer ${_session!.token}';
      }

      final response = await http.get(
        Uri.parse('$kApiBaseUrl/api/complaints$mine'),
        headers: headers,
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as List<dynamic>;
        final loaded = data
            .map((e) => Complaint.fromJson(e as Map<String, dynamic>))
            .toList();
        setState(() {
          _complaints
            ..clear()
            ..addAll(loaded);
          _loading = false;
        });
      } else {
        setState(() {
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _loading = false;
      });
    }
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  void _addComplaint(Complaint complaint) {
    setState(() {
      _complaints.insert(0, complaint);
      _selectedIndex = 0;
    });
  }

  Future<void> _deleteComplaint(Complaint complaint) async {
    try {
      final headers = <String, String>{};
      if (_session != null) {
        headers['Authorization'] = 'Bearer ${_session!.token}';
      }
      final response = await http.delete(
        Uri.parse('$kApiBaseUrl/api/complaints/${complaint.id}'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        setState(() {
          _complaints.removeWhere((c) => c.id == complaint.id);
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Complaint deleted successfully.'),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to delete complaint. Please try again.'),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Network error while deleting complaint.'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      DashboardScreen(complaints: _complaints, onDelete: _deleteComplaint),
      NewComplaintScreen(
        onSubmit: _addComplaint,
        session: _session,
        onRequireLogin: _showAuthSheet,
      ),
      MyComplaintsScreen(complaints: _complaints, onDelete: _deleteComplaint),
    ];

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(86),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF4C1D95), Color(0xFF7C3AED), Color(0xFFF97316)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.vertical(bottom: Radius.circular(18)),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'Rural Women Support',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.2,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _session == null
                              ? 'Secure grievance support · OTP login'
                              : (_session!.user.name.trim().isEmpty
                                  ? _session!.user.phone
                                  : '${_session!.user.name} · ${_session!.user.phone}'),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Color(0xFFF3E8FF),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  _session == null
                      ? FilledButton(
                          onPressed: _showAuthSheet,
                          style: FilledButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: const Color(0xFF4C1D95),
                          ),
                          child: const Text('Login'),
                        )
                      : InkWell(
                          onTap: () async {
                            await showModalBottomSheet<void>(
                              context: context,
                              isScrollControlled: true,
                              showDragHandle: true,
                              builder: (ctx) {
                                return EditProfileSheet(
                                  session: _session!,
                                  onSaved: (nextUser) async {
                                    Navigator.of(ctx).pop();
                                    final messenger = ScaffoldMessenger.of(context);
                                    await _setSession(
                                      AuthSession(token: _session!.token, user: nextUser),
                                    );
                                    if (!mounted) return;
                                    messenger.showSnackBar(
                                      const SnackBar(content: Text('Profile updated.')),
                                    );
                                  },
                                );
                              },
                            );
                          },
                          child: CircleAvatar(
                            radius: 18,
                            backgroundColor: Colors.white,
                            child: Text(
                              (_session!.user.name.trim().isEmpty
                                      ? 'U'
                                      : _session!.user.name.trim()[0])
                                  .toUpperCase(),
                              style: const TextStyle(
                                color: Color(0xFF4C1D95),
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : pages[_selectedIndex],
      bottomNavigationBar: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ProfileFooter(
              session: _session,
              onLogin: _showAuthSheet,
              onLogout: _logout,
              onEditProfile: () async {
                if (_session == null) return;
                await showModalBottomSheet<void>(
                  context: context,
                  isScrollControlled: true,
                  showDragHandle: true,
                  builder: (ctx) {
                    return EditProfileSheet(
                      session: _session!,
                      onSaved: (nextUser) async {
                        Navigator.of(ctx).pop();
                        final messenger = ScaffoldMessenger.of(context);
                        await _setSession(
                          AuthSession(token: _session!.token, user: nextUser),
                        );
                        if (!mounted) return;
                        messenger.showSnackBar(
                          const SnackBar(content: Text('Profile updated.')),
                        );
                      },
                    );
                  },
                );
              },
            ),
            BottomNavigationBar(
              currentIndex: _selectedIndex,
              onTap: _onItemTapped,
              items: const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.dashboard_outlined),
                  label: 'Dashboard',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.add_circle_outline),
                  label: 'New Complaint',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.list_alt),
                  label: 'My Complaints',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

void _showComplaintDetails(
  BuildContext context,
  Complaint complaint,
  Future<void> Function(Complaint) onDelete,
) {
  showModalBottomSheet(
    context: context,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (ctx) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              complaint.category,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text('Village: ${complaint.village}'),
            const SizedBox(height: 4),
            Text('Status: ${complaint.status}'),
            const SizedBox(height: 4),
            Text(
              'Submitted: ${complaint.createdAt.toLocal()}',
              style: const TextStyle(fontSize: 12, color: Colors.black54),
            ),
            const SizedBox(height: 12),
            const Text(
              'Details',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 4),
            Text(complaint.description),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () {
                    Navigator.of(ctx).pop();
                  },
                  child: const Text('Close'),
                ),
                const SizedBox(width: 8),
                TextButton.icon(
                  onPressed: () async {
                    Navigator.of(ctx).pop();
                    await onDelete(complaint);
                  },
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  label: const Text(
                    'Delete',
                    style: TextStyle(color: Colors.red),
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    },
  );
}

class DashboardScreen extends StatelessWidget {
  final List<Complaint> complaints;

  final Future<void> Function(Complaint) onDelete;

  const DashboardScreen({
    super.key,
    required this.complaints,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final total = complaints.length;
    final newCount =
        complaints.where((c) => c.status.toLowerCase() == 'new').length;
    final inProgress = complaints
        .where((c) => c.status.toLowerCase() == 'in progress')
        .length;
    final resolved =
        complaints.where((c) => c.status.toLowerCase() == 'resolved').length;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Overview',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _StatCard(label: 'Total', value: total.toString()),
              _StatCard(label: 'New', value: newCount.toString()),
              _StatCard(label: 'In Progress', value: inProgress.toString()),
              _StatCard(label: 'Resolved', value: resolved.toString()),
            ],
          ),
          const SizedBox(height: 24),
          const Text(
            'Recent Complaints',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: complaints.isEmpty
                ? const Center(child: Text('No complaints yet.'))
                : ListView.separated(
                    itemBuilder: (context, index) {
                      final c = complaints[index];
                      return ListTile(
                        leading: CircleAvatar(
                          child: Text(
                            c.category.isNotEmpty ? c.category[0] : '?',
                          ),
                        ),
                        title: Text(c.category),
                        subtitle: Text(
                          '${c.village} · ${c.description}',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        trailing: Text(
                          c.status,
                          style: TextStyle(
                            color: c.status.toLowerCase() == 'resolved'
                                ? Colors.green
                                : c.status.toLowerCase() == 'new'
                                    ? Colors.orange
                                    : Colors.blue,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        onTap: () {
                          _showComplaintDetails(context, c, onDelete);
                        },
                      );
                    },
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemCount: complaints.length,
                  ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;

  const _StatCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              value,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(label),
          ],
        ),
      ),
    );
  }
}

class NewComplaintScreen extends StatefulWidget {
  final void Function(Complaint complaint) onSubmit;
  final AuthSession? session;
  final Future<void> Function() onRequireLogin;

  const NewComplaintScreen({
    super.key,
    required this.onSubmit,
    required this.session,
    required this.onRequireLogin,
  });

  @override
  State<NewComplaintScreen> createState() => _NewComplaintScreenState();
}

class _NewComplaintScreenState extends State<NewComplaintScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  final _villageController = TextEditingController();
  final _blockController = TextEditingController();
  final _districtController = TextEditingController();
  String _category = 'Safety & Violence';
  bool _anonymous = false;

  @override
  void dispose() {
    _descriptionController.dispose();
    _villageController.dispose();
    _blockController.dispose();
    _districtController.dispose();
    super.dispose();
  }

  void _handleSubmit() async {
    final messenger = ScaffoldMessenger.of(context);
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (widget.session == null) {
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Please login to submit a complaint.'),
        ),
      );
      await widget.onRequireLogin();
      return;
    }

    final description = _descriptionController.text.trim();
    final village = _villageController.text.trim();
    final block = _blockController.text.trim();
    final district = _districtController.text.trim();

    Position? position;

    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (serviceEnabled) {
        LocationPermission permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied) {
          permission = await Geolocator.requestPermission();
        }

        if (permission == LocationPermission.always ||
            permission == LocationPermission.whileInUse) {
          position = await Geolocator.getCurrentPosition(
            desiredAccuracy: LocationAccuracy.high,
          );
        }
      }
    } catch (_) {
      position = null;
    }

    try {
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (widget.session != null) {
        headers['Authorization'] = 'Bearer ${widget.session!.token}';
      }
      final response = await http.post(
        Uri.parse('$kApiBaseUrl/api/complaints'),
        headers: headers,
        body: jsonEncode({
          'category': _category,
          'description': description,
          'village': village,
          'block': block,
          'district': district,
          'anonymous': _anonymous,
          'channel': 'App',
          'priority': 'Medium',
          'latitude': position?.latitude,
          'longitude': position?.longitude,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final complaint = Complaint.fromJson(data);

        widget.onSubmit(complaint);

        messenger.showSnackBar(
          const SnackBar(
            content: Text('Complaint submitted successfully.'),
          ),
        );

        _formKey.currentState!.reset();
        setState(() {
          _category = 'Safety & Violence';
          _anonymous = false;
        });
      } else {
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Failed to submit complaint. Please try again.'),
          ),
        );
      }
    } catch (e) {
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Network error while submitting complaint.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'New Complaint',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            const Text(
              'All fields are mandatory so that your issue can reach the right office.',
              style: TextStyle(fontSize: 12, color: Colors.black54),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              key: ValueKey(_category),
              initialValue: _category,
              decoration: const InputDecoration(
                labelText: 'Category',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(
                  value: 'Safety & Violence',
                  child: Text('Safety & Violence'),
                ),
                DropdownMenuItem(
                  value: 'Legal Rights & Discrimination',
                  child: Text('Legal Rights & Discrimination'),
                ),
                DropdownMenuItem(
                  value: 'Welfare & Schemes',
                  child: Text('Welfare & Schemes'),
                ),
                DropdownMenuItem(
                  value: 'Health & Education',
                  child: Text('Health & Education'),
                ),
                DropdownMenuItem(
                  value: 'Livelihood & SHG',
                  child: Text('Livelihood & SHG'),
                ),
                DropdownMenuItem(
                  value: 'Family / Land / Property',
                  child: Text('Family / Land / Property'),
                ),
              ],
              onChanged: (value) {
                if (value != null) {
                  setState(() {
                    _category = value;
                  });
                }
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descriptionController,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'Describe the problem',
                alignLabelWithHint: true,
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please describe the issue.';
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _villageController,
              decoration: const InputDecoration(
                labelText: 'Village / Locality',
                helperText: 'Name of the village or basti where the issue is.',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Village / locality is required.';
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _blockController,
              decoration: const InputDecoration(
                labelText: 'Block / Tehsil',
                helperText: 'Block or tehsil name for routing to the right office.',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Block / tehsil is required.';
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _districtController,
              decoration: const InputDecoration(
                labelText: 'District',
                helperText: 'District where this problem is located.',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'District is required.';
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            SwitchListTile(
              value: _anonymous,
              onChanged: (value) {
                setState(() {
                  _anonymous = value;
                });
              },
              title: const Text('Submit anonymously'),
              subtitle: const Text(
                'In real deployment, your identity will be protected as per law.',
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _handleSubmit,
                icon: const Icon(Icons.send),
                label: const Text('Submit Complaint'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class MyComplaintsScreen extends StatelessWidget {
  final List<Complaint> complaints;
  final Future<void> Function(Complaint) onDelete;

  const MyComplaintsScreen({
    super.key,
    required this.complaints,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    if (complaints.isEmpty) {
      return const Center(
        child: Text('No complaints submitted yet.'),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) {
        final c = complaints[index];
        return Card(
          child: InkWell(
            onTap: () => _showComplaintDetails(context, c, onDelete),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    c.category,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    c.description,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Village: ${c.village}',
                    style: const TextStyle(color: Colors.black54),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Status: ${c.status}',
                    style: TextStyle(
                      color: c.status.toLowerCase() == 'resolved'
                          ? Colors.green
                          : Colors.blueGrey,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Submitted: ${c.createdAt.toLocal()}',
                    style:
                        const TextStyle(fontSize: 12, color: Colors.black45),
                  ),
                ],
              ),
            ),
          ),
        );
      },
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemCount: complaints.length,
    );
  }
}
